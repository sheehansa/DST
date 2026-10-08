/**
 * Authentication API Routes
 *
 * Session-based authentication using email access control.
 * No passwords - uses pre-configured email lists for admin/judge access.
 *
 * In production, this could be enhanced with:
 * - Firebase Authentication for magic link login
 * - OAuth providers (Google, GitHub)
 */

const express = require('express');
const router = express.Router();
const { loginUser, isAuthorized, getUserInfo } = require('../middleware/auth');

/**
 * POST /api/auth/login
 *
 * Login with email address.
 * Access is controlled by configured ADMIN_EMAILS and JUDGE_EMAILS.
 *
 * Body: { email: string }
 */
router.post('/login', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Check if auth is configured
  if (!require('../../../config').auth.isConfigured()) {
    return res.status(503).json({
      error: 'Authentication not configured',
      message: 'Admin accounts have not been set up yet'
    });
  }

  // Check if email is authorized
  if (!isAuthorized(email)) {
    console.log(`[AUTH] Unauthorized login attempt: ${email}`);
    return res.status(403).json({
      error: 'Access denied',
      message: 'This email is not authorized for admin access'
    });
  }

  // Create session
  const user = loginUser(email);
  req.session.user = user;

  console.log(`[AUTH] User logged in: ${email} as ${user.role}`);

  res.json({
    success: true,
    message: 'Login successful',
    user: getUserInfo(req)
  });
});

/**
 * POST /api/auth/logout
 *
 * Log out current user
 */
router.post('/logout', (req, res) => {
  const userEmail = req.session?.user?.email;
  req.session.destroy((err) => {
    if (err) {
      console.error('[AUTH] Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    console.log(`[AUTH] User logged out: ${userEmail}`);
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

/**
 * GET /api/auth/me
 *
 * Get current user info
 */
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  res.json({
    authenticated: true,
    user: getUserInfo(req)
  });
});

/**
 * GET /api/auth/status
 *
 * Check if authentication is configured
 */
router.get('/status', (req, res) => {
  const config = require('../../config');

  res.json({
    configured: config.auth.isConfigured(),
    adminCount: config.auth.adminEmails.length,
    judgeCount: config.auth.judgeEmails.length
  });
});

module.exports = router;