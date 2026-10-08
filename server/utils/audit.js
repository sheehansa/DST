/**
 * Audit Logging Utility
 *
 * Logs admin and judge actions for security and compliance.
 * In production, logs should be persisted to a database or logging service.
 */

const fs = require('fs');
const path = require('path');

// Log file path (configure in production)
const LOG_FILE = process.env.AUDIT_LOG_FILE || null;

/**
 * Log an audit event
 * @param {Object} params
 * @param {string} params.action - Action type (LOGIN, LOGOUT, SCORE_UPDATE, etc.)
 * @param {string} params.email - User email
 * @param {string} params.role - User role (ADMIN, JUDGE)
 * @param {string} params.resource - Resource affected
 * @param {Object} params.details - Additional details
 * @param {string} params.ip - Client IP address
 */
function logAudit({ action, email, role, resource, details = {}, ip = 'unknown' }) {
  const timestamp = new Date().toISOString();

  const entry = {
    timestamp,
    action,
    email,
    role,
    resource,
    details,
    ip
  };

  // Console output (always)
  console.log(`[AUDIT] ${action} by ${email} (${role}) on ${resource}`, details);

  // File output (if configured)
  if (LOG_FILE) {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(LOG_FILE, logLine);
    } catch (err) {
      console.error('[AUDIT] Failed to write to log file:', err.message);
    }
  }

  return entry;
}

/**
 * Create audit middleware for Express
 * @param {string} actionPrefix - Prefix for action names
 */
function createAuditMiddleware(actionPrefix = 'API') {
  return (req, res, next) => {
    // Store original send to capture response
    const originalSend = res.send;
    res.send = function(body) {
      // Log after response
      if (req.session?.user) {
        const action = `${actionPrefix}_${req.method}_${req.path}`;
        logAudit({
          action,
          email: req.session.user.email,
          role: req.session.user.role,
          resource: req.path,
          details: {
            method: req.method,
            statusCode: res.statusCode,
            query: req.query
          },
          ip: req.ip || req.connection?.remoteAddress || 'unknown'
        });
      }
      return originalSend.call(this, body);
    };
    next();
  };
}

module.exports = {
  logAudit,
  createAuditMiddleware
};