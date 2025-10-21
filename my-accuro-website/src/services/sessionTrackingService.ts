import api from './api';

// Generate a unique session ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('accuro_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('accuro_session_id', sessionId);
  }
  return sessionId;
};

class SessionTrackingService {
  private sessionId: string;
  private trackingEnabled: boolean = true;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = getSessionId();
    this.initializeTracking();
  }

  private initializeTracking() {
    if (!this.trackingEnabled) return;

    // Track session on page load
    this.trackSession();

    // Set up heartbeat to keep session active (every 30 seconds)
    this.heartbeatInterval = setInterval(() => {
      this.trackSession();
    }, 30000);

    // Track page navigation
    window.addEventListener('popstate', () => {
      this.trackSession();
    });

    // Track before page unload
    window.addEventListener('beforeunload', () => {
      this.trackSession();
    });

    // Track clicks (sample rate: 10% to avoid overwhelming the server)
    document.addEventListener('click', (e) => {
      if (Math.random() < 0.1) {
        this.trackInteraction('click', e);
      }
    });
  }

  async trackSession() {
    try {
      const currentPage = window.location.pathname;
      const referrer = document.referrer;
      const userString = localStorage.getItem('user');
      let userId, userEmail, userName;

      if (userString) {
        try {
          const user = JSON.parse(userString);
          userId = user._id;
          userEmail = user.email;
          userName = user.name;
        } catch (e) {
          // Invalid JSON, ignore
        }
      }

      await api.post('/sessions/track', {
        sessionId: this.sessionId,
        userId,
        userEmail,
        userName,
        currentPage,
        referrer,
      });
    } catch (error) {
      // Silently fail to not disrupt user experience
      console.debug('Session tracking failed:', error);
    }
  }

  async trackInteraction(type: 'click' | 'scroll' | 'hover' | 'form_interaction', event?: any) {
    try {
      const page = window.location.pathname;
      let x, y, element;

      if (event && type === 'click') {
        x = event.clientX;
        y = event.clientY;
        element = (event.target as HTMLElement)?.tagName || undefined;
      }

      await api.post('/sessions/track/interaction', {
        sessionId: this.sessionId,
        type,
        element,
        page,
        x,
        y,
      });
    } catch (error) {
      console.debug('Interaction tracking failed:', error);
    }
  }

  stopTracking() {
    this.trackingEnabled = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

// Singleton instance
const sessionTrackingService = new SessionTrackingService();

export default sessionTrackingService;
