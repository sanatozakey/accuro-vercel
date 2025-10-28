import { Request, Response } from 'express';
import ActiveSession from '../models/ActiveSession';
import axios from 'axios';

// Helper function to get location from IP using ipapi.co (free tier)
const getLocationFromIP = async (ip: string) => {
  try {
    // Skip location lookup for localhost/private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip?.startsWith('192.168.') || ip?.startsWith('10.')) {
      return {
        country: 'Local',
        region: 'Development',
        city: 'Localhost',
        latitude: 0,
        longitude: 0,
      };
    }

    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 3000,
    });

    return {
      country: response.data.country_name || 'Unknown',
      region: response.data.region || 'Unknown',
      city: response.data.city || 'Unknown',
      latitude: response.data.latitude || 0,
      longitude: response.data.longitude || 0,
    };
  } catch (error) {
    console.error('Error fetching location from IP:', error);
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      latitude: 0,
      longitude: 0,
    };
  }
};

// Helper function to parse user agent
const parseUserAgent = (userAgent: string) => {
  const ua = userAgent.toLowerCase();

  // Detect browser
  let browser = 'Unknown';
  let browserVersion = '';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
    const match = ua.match(/edg\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  }

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Detect device type
  let device = 'Desktop';
  if (ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

  return { browser, browserVersion, os, device };
};

export const createOrUpdateSession = async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      userId,
      userEmail,
      userName,
      currentPage,
      referrer,
      browserLatitude,
      browserLongitude,
    } = req.body;

    if (!sessionId || !currentPage) {
      return res.status(400).json({ message: 'Session ID and current page are required' });
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                      (req.headers['x-real-ip'] as string) ||
                      req.socket.remoteAddress ||
                      '127.0.0.1';

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const { browser, browserVersion, os, device } = parseUserAgent(userAgent);

    let session = await ActiveSession.findOne({ sessionId });

    if (session) {
      // Update existing session
      session.currentPage = currentPage;
      session.lastActivity = new Date();
      session.isActive = true;

      if (userId) session.userId = userId;
      if (userEmail) session.userEmail = userEmail;
      if (userName) session.userName = userName;

      // Update location if browser geolocation is provided (more accurate)
      if (browserLatitude !== undefined && browserLongitude !== undefined) {
        session.latitude = browserLatitude;
        session.longitude = browserLongitude;
        // Keep city/region/country from IP location as browser geolocation doesn't provide these
      }

      // Add page view
      session.pageViews.push({
        page: currentPage,
        timestamp: new Date(),
      } as any);

      await session.save();
    } else {
      // Get location from IP first
      const location = await getLocationFromIP(ipAddress);

      // Prioritize browser geolocation if available (more accurate)
      const latitude = browserLatitude !== undefined ? browserLatitude : location.latitude;
      const longitude = browserLongitude !== undefined ? browserLongitude : location.longitude;

      // Create new session
      session = new ActiveSession({
        sessionId,
        userId: userId || undefined,
        userEmail: userEmail || undefined,
        userName: userName || undefined,
        isAnonymous: !userId,
        ipAddress,
        userAgent,
        browser,
        browserVersion,
        os,
        device,
        country: location.country,
        region: location.region,
        city: location.city,
        latitude,
        longitude,
        currentPage,
        referrer: referrer || undefined,
        lastActivity: new Date(),
        startedAt: new Date(),
        pageViews: [{
          page: currentPage,
          timestamp: new Date(),
        }],
        interactions: [],
        isActive: true,
      });

      await session.save();
    }

    res.status(200).json({
      message: 'Session updated successfully',
      sessionId: session.sessionId
    });
  } catch (error: any) {
    console.error('Error creating/updating session:', error);
    res.status(500).json({ message: 'Failed to update session', error: error.message });
  }
};

export const trackInteraction = async (req: Request, res: Response) => {
  try {
    const { sessionId, type, element, page, x, y } = req.body;

    if (!sessionId || !type || !page) {
      return res.status(400).json({ message: 'Session ID, type, and page are required' });
    }

    const session = await ActiveSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.interactions.push({
      type,
      element: element || undefined,
      page,
      x: x || undefined,
      y: y || undefined,
      timestamp: new Date(),
    } as any);

    session.lastActivity = new Date();
    session.isActive = true;

    await session.save();

    res.status(200).json({ message: 'Interaction tracked successfully' });
  } catch (error: any) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({ message: 'Failed to track interaction', error: error.message });
  }
};

export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    // Sessions active in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const sessions = await ActiveSession.find({
      lastActivity: { $gte: fiveMinutesAgo },
      isActive: true,
    })
      .select('-interactions -pageViews') // Exclude large arrays for list view
      .sort({ lastActivity: -1 })
      .limit(100);

    const totalActive = sessions.length;
    const anonymousSessions = sessions.filter(s => s.isAnonymous).length;
    const authenticatedSessions = sessions.filter(s => !s.isAnonymous).length;

    // Get location distribution
    const locationDistribution = sessions.reduce((acc: any, session) => {
      const key = session.country || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Get page distribution
    const pageDistribution = sessions.reduce((acc: any, session) => {
      const key = session.currentPage || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Get device distribution
    const deviceDistribution = sessions.reduce((acc: any, session) => {
      const key = session.device || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Get browser distribution
    const browserDistribution = sessions.reduce((acc: any, session) => {
      const key = session.browser || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      totalActive,
      anonymousSessions,
      authenticatedSessions,
      sessions,
      stats: {
        locationDistribution,
        pageDistribution,
        deviceDistribution,
        browserDistribution,
      },
    });
  } catch (error: any) {
    console.error('Error getting active sessions:', error);
    res.status(500).json({ message: 'Failed to get active sessions', error: error.message });
  }
};

export const getSessionHeatmap = async (req: Request, res: Response) => {
  try {
    const { page, startDate, endDate } = req.query;

    const query: any = {};

    if (page) {
      query['interactions.page'] = page;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    // Get all sessions with interactions
    const sessions = await ActiveSession.find(query).select('interactions');

    // Flatten all interactions
    const allInteractions: any[] = [];
    sessions.forEach(session => {
      session.interactions.forEach(interaction => {
        if (interaction.type === 'click' && interaction.x !== undefined && interaction.y !== undefined) {
          allInteractions.push({
            x: interaction.x,
            y: interaction.y,
            page: interaction.page,
            element: interaction.element,
            timestamp: interaction.timestamp,
          });
        }
      });
    });

    // Filter by page if specified
    const filteredInteractions = page
      ? allInteractions.filter(i => i.page === page)
      : allInteractions;

    res.status(200).json({
      total: filteredInteractions.length,
      interactions: filteredInteractions,
    });
  } catch (error: any) {
    console.error('Error getting heatmap data:', error);
    res.status(500).json({ message: 'Failed to get heatmap data', error: error.message });
  }
};

export const getSessionDetails = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await ActiveSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.status(200).json(session);
  } catch (error: any) {
    console.error('Error getting session details:', error);
    res.status(500).json({ message: 'Failed to get session details', error: error.message });
  }
};

export const cleanupInactiveSessions = async (req: Request, res: Response) => {
  try {
    // Mark sessions inactive if no activity in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const result = await ActiveSession.updateMany(
      {
        lastActivity: { $lt: fiveMinutesAgo },
        isActive: true,
      },
      {
        $set: { isActive: false },
      }
    );

    res.status(200).json({
      message: 'Inactive sessions cleaned up successfully',
      deactivated: result.modifiedCount,
    });
  } catch (error: any) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({ message: 'Failed to cleanup sessions', error: error.message });
  }
};
