/**
 * Authentication Middleware
 *
 * Handles session-based authentication for admin and judge roles.
 * Uses email-based access control (no passwords - magic link style).
 *
 * IMPORTANT: This is a basic implementation. For production:
 * - Consider using Firebase Authentication for secure magic links
 * - Add CSRF protection
 * - Add session timeout
 * - Add login attempt rate limiting
 */

const config = require('../../config');

/**
 * Check if user is authenticated
 */
function requireAuth(req, res, next) {
  if (!config.auth.isConfigured()) {
    // Auth not configured - return 503
    return res.status(503).json({
      error: 'Authentication not configured',
      message: 'Admin accounts have not been set up yet'
    });
  }

  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please log in to access this resource'
    });
  }

  next();
}

/**
 * Check if user has required role(s)
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Please log in to access this resource'
      });
    }

    const userRole = req.session.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires ${roles.join(' or ')} access`
      });
    }

    next();
  };
}

/**
 * Check if user is admin
 */
function requireAdmin(req, res, next) {
  return requireRole(['ADMIN'])(req, res, next);
}

/**
 * Check if user is judge or admin
 */
function requireJudge(req, res, next) {
  return requireRole(['ADMIN', 'JUDGE'])(req, res, next);
}

/**
 * Log in a user based on email
 * Determines role based on configured admin/judge lists
 */
function loginUser(email) {
  const normalizedEmail = email.toLowerCase().trim();

  let role = 'VIEWER';

  if (config.auth.adminEmails.includes(normalizedEmail)) {
    role = 'ADMIN';
  } else if (config.auth.judgeEmails.includes(normalizedEmail)) {
    role = 'JUDGE';
  }

  return {
    email: normalizedEmail,
    role,
    loginTime: new Date().toISOString()
  };
}

/**
 * Check if an email is authorized for any role
 */
function isAuthorized(email) {
  const normalizedEmail = email.toLowerCase().trim();
  return (
    config.auth.adminEmails.includes(normalizedEmail) ||
    config.auth.judgeEmails.includes(normalizedEmail)
  );
}

/**
 * Get current user info (without sensitive data)
 */
function getUserInfo(req) {
  if (!req.session || !req.session.user) {
    return null;
  }

  return {
    email: req.session.user.email,
    role: req.session.user.role,
    loginTime: req.session.user.loginTime
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireJudge,
  loginUser,
  isAuthorized,
  getUserInfo
};