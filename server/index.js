/**
 * Waste Resource Symposium 2026 - Server Entry Point
 *
 * Express.js server with Google Sheets integration
 *
 * Prerequisites:
 * - Copy .env.example to .env and fill in credentials
 * - Run: npm install
 * - Run: npm start
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('../config');

// Initialize Express
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", 'https://forms.gle']
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Session configuration
app.use(session({
  secret: config.auth.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.server.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files (frontend)
app.use(express.static(path.join(__dirname, '..')));

// API Routes
const authRoutes = require('./routes/auth');
const teamsRoutes = require('./routes/teams');
const scoringRoutes = require('./routes/scoring');

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    googleSheets: config.google.isConfigured() ? 'configured' : 'pending',
    auth: config.auth.isConfigured() ? 'configured' : 'pending'
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/scoring', scoringRoutes);

// API endpoint for form configuration (public - no sensitive data)
app.get('/api/forms', (req, res) => {
  res.json({
    symposium: {
      url: config.forms.symposium.url,
      name: config.forms.symposium.name,
      tagline: config.forms.symposium.tagline,
      registrationOpen: config.forms.status.symposiumOpen
    },
    studentChallenge: {
      url: config.forms.studentChallenge.url,
      name: config.forms.studentChallenge.name,
      tagline: config.forms.studentChallenge.tagline,
      deadline: config.forms.studentChallenge.deadline,
      registrationOpen: config.forms.status.challengeOpen
    }
  });
});

// Serve index.html for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  // Don't interfere with actual files
  if (req.path.includes('.')) {
    return res.status(404).sendFile(path.join(__dirname, '..', '404.html'));
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: config.server.nodeEnv === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Waste Resource Symposium 2026 - Server                    ║
║  Government of Goa                                          ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                  ║
║  Environment: ${config.server.nodeEnv.padEnd(40)}║
╠════════════════════════════════════════════════════════════╣
║  Status:                                                    ║
║  - Google Sheets: ${config.google.isConfigured() ? '✅ Configured' : '⚠️ Pending env vars'.padEnd(40)}║
║  - Authentication: ${config.auth.isConfigured() ? '✅ Configured' : '⚠️ Pending env vars'.padEnd(38)}║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;