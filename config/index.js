/**
 * Main Configuration Loader
 *
 * Loads environment variables and provides centralized configuration
 * for the Waste Resource Symposium 2026 application.
 */

require('dotenv').config();

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  },

  // Google Sheets API Configuration
  // These values will be undefined until provided via environment variables
  google: {
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null,
    privateKey: process.env.GOOGLE_PRIVATE_KEY || null,
    sheetIdSymposium: process.env.GOOGLE_SHEET_ID_SYMPOSIUM || null,
    sheetIdStudentChallenge: process.env.GOOGLE_SHEET_ID_STUDENT_CHALLENGE || null,
    // Whether Google Sheets integration is configured
    isConfigured: function() {
      return !!(this.serviceAccountEmail && this.privateKey &&
                this.sheetIdSymposium && this.sheetIdStudentChallenge);
    }
  },

  // Authentication Configuration
  auth: {
    sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    adminEmails: process.env.ADMIN_EMAILS ?
      process.env.ADMIN_EMAILS.split(',').map(e => e.trim()) : [],
    judgeEmails: process.env.JUDGE_EMAILS ?
      process.env.JUDGE_EMAILS.split(',').map(e => e.trim()) : [],
    // Check if auth is configured
    isConfigured: function() {
      return this.adminEmails.length > 0;
    }
  },

  // Security Configuration
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Caching Configuration
  cache: {
    ttlMs: parseInt(process.env.CACHE_TTL_MS) || 300000 // 5 minutes
  },

  // Symposium Registration URL (when provided)
  symposium: {
    registrationUrl: process.env.SYMPOSIUM_REGISTRATION_URL || null,
    isOpen: false // Default to closed until explicitly enabled
  },

  // External form URLs (from Formlinks.txt)
  forms: require('./forms')
};