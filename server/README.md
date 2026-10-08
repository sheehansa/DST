# Waste Resource Symposium 2026 - Backend Server

This directory contains the Express.js backend for the Waste Resource Symposium 2026 website.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials (see below)

# Start development server
npm run dev

# Start production server
npm start
```

## Configuration Required

Before running, you must configure the following in `.env`:

### Google Sheets API (Required)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable Google Sheets API
4. Create a Service Account
5. Download the JSON key file
6. Add credentials to `.env`:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_SHEET_ID_SYMPOSIUM`
   - `GOOGLE_SHEET_ID_STUDENT_CHALLENGE`

### Admin Accounts

Add authorized email addresses:
- `ADMIN_EMAILS=admin1@goa.gov.in,admin2@goa.gov.in`
- `JUDGE_EMAILS=judge1@goa.gov.in,judge2@goa.gov.in`

### Session Secret

Generate a random secret (at least 32 characters):
```bash
SESSION_SECRET=your-random-secret-here
```

## API Endpoints

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/forms` | GET | Form configuration (public) |
| `/api/teams` | GET | Public team list (sanitized) |
| `/api/scoring/criteria` | GET | Scoring criteria |

### Protected Endpoints (require login)

| Endpoint | Method | Description | Roles |
|----------|--------|-------------|-------|
| `/api/auth/login` | POST | Login with email | - |
| `/api/auth/logout` | POST | Logout | - |
| `/api/auth/me` | GET | Current user info | - |
| `/api/teams/admin/all` | GET | All teams (with personal info) | ADMIN, JUDGE |
| `/api/teams/:id/status` | POST | Update team status | ADMIN |
| `/api/scoring/teams/:id` | GET | Team scores | ADMIN, JUDGE |
| `/api/scoring/teams/:id` | POST | Submit scores | ADMIN, JUDGE |
| `/api/scoring/leaderboard` | GET | Team rankings | ADMIN, JUDGE |
| `/api/scoring/judges` | GET | Judge activity | ADMIN |

## Security Features

- **Helmet** - HTTP security headers
- **CORS** - Cross-origin resource sharing control
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Session Management** - Secure session cookies
- **Role-based Access** - ADMIN, JUDGE, VIEWER roles

## Data Flow

```
Google Forms → Google Sheets → Sheets API → Backend → Sanitized API → Frontend
```

## Empty Data Handling

The system is designed to handle empty datasets gracefully:
- `/api/teams` returns `{ teams: [], count: 0, empty: true }` when no teams registered
- Frontend shows appropriate empty states
- No fake/sample data is created

## Development Notes

- All credentials use environment variables - never hardcode
- Google Sheets credentials are read-only (no write access in current version)
- Sessions expire after 24 hours
- Scores are stored in-memory (restart clears data)