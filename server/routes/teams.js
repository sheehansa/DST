/**
 * Teams API Routes
 *
 * Public and protected endpoints for team data.
 * Public endpoints return sanitized data only.
 * Protected endpoints require admin/judge authentication.
 */

const express = require('express');
const router = express.Router();
const sheetsService = require('../services/sheets');
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * GET /api/teams
 *
 * Public endpoint - returns sanitized public team data
 * Handles empty datasets gracefully
 */
router.get('/', async (req, res) => {
  try {
    const result = await sheetsService.getPublicStudentTeams();

    // Return empty array if no teams yet - this is expected before registration opens
    res.json({
      teams: result.teams,
      count: result.count,
      empty: result.empty,
      message: result.empty ? 'No teams registered yet. Registration is open.' : undefined
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Unable to fetch teams' });
  }
});

/**
 * GET /api/teams/:id
 *
 * Public endpoint - returns single team by index
 * Note: This uses array index which isn't stable.
 * Should use a unique ID in production.
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await sheetsService.getPublicStudentTeams();
    const index = parseInt(req.params.id);

    if (isNaN(index) || index < 0 || index >= result.teams.length) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(result.teams[index]);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Unable to fetch team' });
  }
});

/**
 * GET /api/teams/admin/all
 *
 * Protected endpoint - returns all team data including personal info
 * Requires admin or judge role
 */
router.get('/admin/all', requireAuth, requireRole(['ADMIN', 'JUDGE']), async (req, res) => {
  try {
    const result = await sheetsService.getAllStudentTeams();

    res.json({
      teams: result.teams,
      count: result.count,
      empty: result.empty
    });
  } catch (error) {
    console.error('Error fetching all teams:', error);
    res.status(500).json({ error: 'Unable to fetch teams' });
  }
});

/**
 * POST /api/teams/:id/status
 *
 * Protected endpoint - update team status
 * Requires admin role
 */
router.post('/:id/status', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  const { status } = req.body;
  const teamIndex = parseInt(req.params.id);

  if (!status || !['Pending Review', 'Shortlisted', 'Finalist', 'Selected', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  // Note: In production, this would update the Google Sheet
  // For now, log the action (actual implementation requires write access)
  console.log(`[ADMIN] ${req.session.user?.email} changed team ${teamIndex} status to: ${status}`);

  res.json({
    success: true,
    message: 'Team status updated (write to Google Sheets not implemented - requires write permissions)',
    teamIndex,
    newStatus: status
  });
});

module.exports = router;