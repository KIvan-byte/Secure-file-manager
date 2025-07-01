const crypto = require('crypto');
const EventEmitter = require('events');

/**
 * Security middleware for rate limiting, CSRF protection, and attack prevention
 */
class SecurityMiddleware extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Rate limiting configuration
    this.rateLimits = new Map();
    this.rateLimitConfig = {
      fileShare: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10, // 10 file shares per 15 minutes
        blockDuration: 60 * 60 * 1000 // 1 hour block
      },
      fileAccess: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30, // 30 file accesses per minute
        blockDuration: 5 * 60 * 1000 // 5 minutes block
      },
      encryption: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 5, // 5 encryption attempts per minute
        blockDuration: 10 * 60 * 1000 // 10 minutes block
      },
      authentication: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 5, // 5 failed attempts per 5 minutes
        blockDuration: 30 * 60 * 1000 // 30 minutes block
      }
    };
    
    // CSRF protection
    this.csrfTokens = new Map();
    this.csrfTokenExpiry = 30 * 60 * 1000; // 30 minutes
    
    // Blocked IPs and clients
    this.blockedClients = new Map();
    this.suspiciousActivity = new Map();
    
    // Request validation
    this.maxRequestSize = options.maxRequestSize || 10 * 1024 * 1024; // 10MB
    this.allowedOrigins = options.allowedOrigins || ['http://localhost:5174', 'file://'];
    
    // Cleanup intervals
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Cleanup every minute
    
    // Security event logging
    this.securityEvents = [];
    this.maxSecurityEvents = 1000;
    
    this.initializeSecurity();
  }
  
  /**
   * Initialize security measures
   */
  initializeSecurity() {
    // Setup security headers
    this.securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }
  
  /**
   * Get client identifier from request
   * @param {Object} req - Request object
   * @returns {string} - Client identifier
   */
  getClientId(req) {
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
              (req.connection.socket ? req.connection.socket.remoteAddress : null);
    const userAgent = req.headers['user-agent'] || '';
    const sessionId = req.headers['x-session-id'] || '';
    
    // Create a hash of identifying information
    const identifier = crypto.createHash('sha256')
      .update(`${ip}:${userAgent}:${sessionId}`)
      .digest('hex');
    
    return identifier;
  }
  
  /**
   * Check rate limit for client and action
   * @param {string} clientId - Client identifier
   * @param {string} action - Action type
   * @returns {Object} - Rate limit status
   */
  checkRateLimit(clientId, action) {
    const config = this.rateLimitConfig[action];
    if (!config) {
      return { allowed: true, remaining: Infinity };
    }
    
    const key = `${clientId}:${action}`;
    const now = Date.now();
    
    // Check if client is blocked
    if (this.blockedClients.has(clientId)) {
      const blockInfo = this.blockedClients.get(clientId);
      if (now < blockInfo.until) {
        this.logSecurityEvent('rate_limit_blocked', {
          clientId,
          action,
          blockUntil: blockInfo.until
        });
        return {
          allowed: false,
          remaining: 0,
          resetTime: blockInfo.until,
          blocked: true
        };
      } else {
        // Block expired, remove it
        this.blockedClients.delete(clientId);
      }
    }
    
    // Get or create rate limit entry
    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, {
        requests: [],
        firstRequest: now
      });
    }
    
    const limitData = this.rateLimits.get(key);
    
    // Remove old requests outside the time window
    limitData.requests = limitData.requests.filter(
      timestamp => now - timestamp < config.windowMs
    );
    
    // Check if limit exceeded
    if (limitData.requests.length >= config.maxRequests) {
      // Block the client
      this.blockedClients.set(clientId, {
        until: now + config.blockDuration,
        reason: `Rate limit exceeded for ${action}`,
        action
      });
      
      this.logSecurityEvent('rate_limit_exceeded', {
        clientId,
        action,
        requests: limitData.requests.length,
        limit: config.maxRequests
      });
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + config.blockDuration,
        blocked: true
      };
    }
    
    // Add current request
    limitData.requests.push(now);
    
    return {
      allowed: true,
      remaining: config.maxRequests - limitData.requests.length,
      resetTime: now + config.windowMs
    };
  }
  
  /**
   * Generate CSRF token
   * @param {string} sessionId - Session identifier
   * @returns {string} - CSRF token
   */
  generateCSRFToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + this.csrfTokenExpiry;
    
    this.csrfTokens.set(token, {
      sessionId,
      expires,
      used: false
    });
    
    return token;
  }
  
  /**
   * Validate CSRF token
   * @param {string} token - CSRF token
   * @param {string} sessionId - Session identifier
   * @returns {boolean} - Token validity
   */
  validateCSRFToken(token, sessionId) {
    if (!token || !sessionId || typeof token !== 'string') {
      return false;
    }
    
    const tokenData = this.csrfTokens.get(token);
    if (!tokenData) {
      this.logSecurityEvent('csrf_invalid_token', { token: token.substring(0, 8) + '...', sessionId });
      return false;
    }
    
    // Check expiration
    if (Date.now() > tokenData.expires) {
      this.csrfTokens.delete(token);
      this.logSecurityEvent('csrf_expired_token', { token: token.substring(0, 8) + '...', sessionId });
      return false;
    }
    
    // Check session match
    if (tokenData.sessionId !== sessionId) {
      this.logSecurityEvent('csrf_session_mismatch', { token: token.substring(0, 8) + '...', sessionId });
      return false;
    }
    
    // Check if already used (prevent replay attacks)
    if (tokenData.used) {
      this.logSecurityEvent('csrf_token_reuse', { token: token.substring(0, 8) + '...', sessionId });
      return false;
    }
    
    // Mark as used
    tokenData.used = true;
    
    return true;
  }
  
  /**
   * Validate file path to prevent directory traversal
   * @param {string} filePath - File path to validate
   * @returns {boolean} - Path validity
   */
  validateFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }
    
    // Normalize path
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      /\.\./,           // Directory traversal
      /\/\//,           // Double slashes
      /\0/,             // Null bytes
      /[<>:"|?*]/       // Invalid filename characters (removed for Unix compatibility)
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(normalizedPath)) {
        this.logSecurityEvent('path_traversal_attempt', { 
          filePath: filePath.substring(0, 100) + (filePath.length > 100 ? '...' : ''),
          reason: 'dangerous_pattern'
        });
        return false;
      }
    }
    
    // Additional checks for suspicious patterns
    if (normalizedPath.includes('/../') || normalizedPath.endsWith('/..')) {
      this.logSecurityEvent('path_traversal_attempt', { 
        filePath: filePath.substring(0, 100) + (filePath.length > 100 ? '...' : ''),
        reason: 'directory_traversal'
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate request origin
   * @param {Object} req - Request object
   * @returns {boolean} - Origin validity
   */
  validateOrigin(req) {
    const origin = req.headers.origin || req.headers.referer;
    
    if (!origin) {
      // Allow requests without origin (like direct file access)
      return true;
    }
    
    // Check against allowed origins
    const isAllowed = this.allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin === '*') return true;
      if (typeof allowedOrigin === 'string') {
        return origin.startsWith(allowedOrigin);
      }
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (!isAllowed) {
      this.logSecurityEvent('invalid_origin', { origin });
    }
    
    return isAllowed;
  }
  
  /**
   * Validate request size
   * @param {Object} req - Request object
   * @returns {boolean} - Size validity
   */
  validateRequestSize(req) {
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength) > this.maxRequestSize) {
      this.logSecurityEvent('request_too_large', { 
        contentLength: parseInt(contentLength),
        maxSize: this.maxRequestSize 
      });
      return false;
    }
    return true;
  }
  
  /**
   * Detect suspicious activity
   * @param {string} clientId - Client identifier
   * @param {string} activity - Activity type
   * @param {Object} details - Activity details
   */
  detectSuspiciousActivity(clientId, activity, details = {}) {
    if (!this.suspiciousActivity.has(clientId)) {
      this.suspiciousActivity.set(clientId, {
        activities: [],
        score: 0,
        firstSeen: Date.now()
      });
    }
    
    const clientData = this.suspiciousActivity.get(clientId);
    clientData.activities.push({
      activity,
      timestamp: Date.now(),
      details
    });
    
    // Calculate suspicion score
    let score = 0;
    const recentActivities = clientData.activities.filter(
      a => Date.now() - a.timestamp < 60 * 1000 // Last minute
    );
    
    // Score based on activity types
    for (const act of recentActivities) {
      switch (act.activity) {
        case 'failed_auth':
          score += 10;
          break;
        case 'path_traversal':
          score += 20;
          break;
        case 'csrf_violation':
          score += 15;
          break;
        case 'rate_limit':
          score += 5;
          break;
        case 'invalid_request':
          score += 3;
          break;
        default:
          score += 1;
      }
    }
    
    clientData.score = score;
    
    // Auto-block highly suspicious clients
    if (score >= 50) {
      this.blockedClients.set(clientId, {
        until: Date.now() + 60 * 60 * 1000, // 1 hour
        reason: 'Suspicious activity detected',
        action: 'auto_block'
      });
      
      this.logSecurityEvent('auto_blocked_suspicious', {
        clientId,
        score,
        activities: recentActivities.length
      });
    }
  }
  
  /**
   * Log security event
   * @param {string} type - Event type
   * @param {Object} details - Event details
   */
  logSecurityEvent(type, details = {}) {
    const event = {
      type,
      timestamp: Date.now(),
      details
    };
    
    this.securityEvents.push(event);
    
    // Limit event storage
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents.shift();
    }
    
    // Emit event for external handling
    this.emit('securityEvent', event);
    
    // Log to console for development
    console.warn(`Security Event [${type}]:`, details);
  }
  
  /**
   * Express middleware for security validation
   * @param {Object} options - Middleware options
   * @returns {Function} - Express middleware function
   */
  middleware(options = {}) {
    const { 
      requireCSRF = false, 
      rateLimit = null,
      validatePath = true,
      requireOrigin = false 
    } = options;
    
    return (req, res, next) => {
      const clientId = this.getClientId(req);
      
      // Add security headers
      for (const [header, value] of Object.entries(this.securityHeaders)) {
        res.setHeader(header, value);
      }
      
      // Validate request size
      if (!this.validateRequestSize(req)) {
        this.detectSuspiciousActivity(clientId, 'invalid_request', { reason: 'request_too_large' });
        return res.status(413).json({ error: 'Request too large' });
      }
      
      // Validate origin if required
      if (requireOrigin && !this.validateOrigin(req)) {
        this.detectSuspiciousActivity(clientId, 'invalid_request', { reason: 'invalid_origin' });
        return res.status(403).json({ error: 'Invalid origin' });
      }
      
      // Check rate limits
      if (rateLimit) {
        const limitResult = this.checkRateLimit(clientId, rateLimit);
        if (!limitResult.allowed) {
          this.detectSuspiciousActivity(clientId, 'rate_limit', { action: rateLimit });
          return res.status(429).json({ 
            error: 'Rate limit exceeded',
            resetTime: limitResult.resetTime
          });
        }
        
        // Add rate limit headers
        res.setHeader('X-RateLimit-Remaining', limitResult.remaining);
        res.setHeader('X-RateLimit-Reset', limitResult.resetTime);
      }
      
      // Validate CSRF token if required
      if (requireCSRF) {
        const token = req.headers['x-csrf-token'] || req.body.csrfToken;
        const sessionId = req.headers['x-session-id'] || req.sessionId;
        
        if (!this.validateCSRFToken(token, sessionId)) {
          this.detectSuspiciousActivity(clientId, 'csrf_violation');
          return res.status(403).json({ error: 'Invalid CSRF token' });
        }
      }
      
      // Validate file paths in request
      if (validatePath) {
        const pathsToCheck = [
          req.body?.filePath,
          req.body?.inputPath,
          req.body?.outputPath,
          req.params?.path,
          req.query?.path
        ].filter(Boolean);
        
        for (const path of pathsToCheck) {
          if (!this.validateFilePath(path)) {
            this.detectSuspiciousActivity(clientId, 'path_traversal', { path });
            return res.status(400).json({ error: 'Invalid file path' });
          }
        }
      }
      
      // Add security context to request
      req.security = {
        clientId,
        generateCSRFToken: (sessionId) => this.generateCSRFToken(sessionId),
        logEvent: (type, details) => this.logSecurityEvent(type, details)
      };
      
      next();
    };
  }
  
  /**
   * Cleanup expired data
   */
  cleanup() {
    const now = Date.now();
    
    // Cleanup rate limits
    for (const [key, data] of this.rateLimits) {
      data.requests = data.requests.filter(
        timestamp => now - timestamp < Math.max(...Object.values(this.rateLimitConfig).map(c => c.windowMs))
      );
      
      if (data.requests.length === 0) {
        this.rateLimits.delete(key);
      }
    }
    
    // Cleanup expired CSRF tokens
    for (const [token, data] of this.csrfTokens) {
      if (now > data.expires) {
        this.csrfTokens.delete(token);
      }
    }
    
    // Cleanup expired blocks
    for (const [clientId, blockData] of this.blockedClients) {
      if (now > blockData.until) {
        this.blockedClients.delete(clientId);
      }
    }
    
    // Cleanup old suspicious activity data
    for (const [clientId, data] of this.suspiciousActivity) {
      data.activities = data.activities.filter(
        activity => now - activity.timestamp < 24 * 60 * 60 * 1000 // Keep 24 hours
      );
      
      if (data.activities.length === 0) {
        this.suspiciousActivity.delete(clientId);
      }
    }
  }
  
  /**
   * Get security statistics
   * @returns {Object} - Security statistics
   */
  getStats() {
    return {
      rateLimits: this.rateLimits.size,
      csrfTokens: this.csrfTokens.size,
      blockedClients: this.blockedClients.size,
      suspiciousClients: this.suspiciousActivity.size,
      securityEvents: this.securityEvents.length,
      recentEvents: this.securityEvents.filter(
        event => Date.now() - event.timestamp < 60 * 60 * 1000 // Last hour
      ).length
    };
  }
  
  /**
   * Get recent security events
   * @param {number} limit - Maximum number of events
   * @returns {Array} - Recent security events
   */
  getRecentEvents(limit = 50) {
    return this.securityEvents
      .slice(-limit)
      .reverse(); // Most recent first
  }
  
  /**
   * Cleanup on shutdown
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.rateLimits.clear();
    this.csrfTokens.clear();
    this.blockedClients.clear();
    this.suspiciousActivity.clear();
    this.securityEvents.length = 0;
  }
}

module.exports = SecurityMiddleware;
