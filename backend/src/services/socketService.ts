import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

interface UserSocket {
  socketId: string;
  userId: string;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  /**
   * Initialize Socket.io server
   */
  initialize(httpServer: HTTPServer, corsOrigins: string[]): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(
          token as string,
          process.env.JWT_SECRET || 'your-secret-key'
        ) as DecodedToken;

        // Attach user ID to socket
        (socket as any).userId = decoded.id;

        // Load role so we can room-join admins/superadmins
        const user = await User.findById(decoded.id).select('role');
        (socket as any).userRole = user?.role || 'user';

        next();
      } catch (error) {
        console.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket: Socket) => {
      const userId = (socket as any).userId;
      const userRole = (socket as any).userRole;
      console.log(`User connected: ${userId} role=${userRole} (socket: ${socket.id})`);

      // Add socket to user's socket set
      this.addUserSocket(userId, socket.id);

      // Join user to their personal room
      socket.join(`user:${userId}`);

      // Admins and superadmins join the broadcast room for chat/dispatch events
      if (userRole === 'admin' || userRole === 'superadmin') {
        socket.join('admins');
      }

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${userId} (socket: ${socket.id}), reason: ${reason}`);
        this.removeUserSocket(userId, socket.id);
      });

      // Handle reconnection events
      socket.on('reconnect', () => {
        console.log(`User reconnected: ${userId} (socket: ${socket.id})`);
        this.addUserSocket(userId, socket.id);
      });

      // Ping-pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    console.log('Socket.io server initialized');
    return this.io;
  }

  /**
   * Add a socket to user's socket set
   */
  private addUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  /**
   * Remove a socket from user's socket set
   */
  private removeUserSocket(userId: string, socketId: string): void {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socketId);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Get the Socket.io server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Emit an event to a specific user
   */
  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) {
      console.warn('Socket.io not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, data);
    console.log(`Emitted ${event} to user ${userId}`);
  }

  /**
   * Emit an event to multiple users
   */
  emitToUsers(userIds: string[], event: string, data: any): void {
    userIds.forEach((userId) => {
      this.emitToUser(userId, event, data);
    });
  }

  /**
   * Emit an event to all admin users
   */
  emitToAdmins(event: string, data: any): void {
    if (!this.io) {
      console.warn('Socket.io not initialized');
      return;
    }

    this.io.to('admins').emit(event, data);
    console.log(`Emitted ${event} to admins`);
  }

  /**
   * Broadcast an event to all connected users
   */
  broadcast(event: string, data: any): void {
    if (!this.io) {
      console.warn('Socket.io not initialized');
      return;
    }

    this.io.emit(event, data);
    console.log(`Broadcast ${event} to all users`);
  }

  /**
   * Check if a user is currently connected
   */
  isUserOnline(userId: string): boolean {
    const userSocketSet = this.userSockets.get(userId);
    return userSocketSet !== undefined && userSocketSet.size > 0;
  }

  /**
   * Get count of online users
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get list of online user IDs
   */
  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
