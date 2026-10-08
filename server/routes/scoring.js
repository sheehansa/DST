/**
 * Scoring API Routes
 *
 * Endpoints for judges to score student challenge submissions.
 * Based on the 6 evaluation criteria from the PDF:
 * - Functionality
 * - Innovation
 * - Practicality
 * - Environmental Impact
 * - Affordability
 * - Scalability
 *
 * Scores are stored in memory (in production, write to Google Sheets)
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, getUserInfo } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// In-memory score storage (in production, persist to Google Sheets)
// Structure: { teamId: { judgeEmail: { criteria: score, ..., total, timestamp } } }
const scores = {};

// Evaluation criteria (from PDF)
const CRITERIA = [
  { key: 'functionality', label: 'Functionality', maxScore: 10, weight: 1 },
  { key: 'innovation', label: 'Innovation', maxScore: 10, weight: 1 },
  { key: 'practicality', label: 'Practicality', maxScore: 10, weight: 1 },
  { key: 'environmentalImpact', label: 'Environmental Impact', maxScore: 10, weight: 1 },
  { key: 'affordability', label: 'Affordability', maxScore: 10, weight: 1 },
  { key: 'scalability', label: 'Scalability', maxScore: 10, weight: 1 }
];

/**
 * GET /api/scoring/criteria
 *
 * Public endpoint - returns scoring criteria
 */
router.get('/criteria', (req, res) => {
  res.json({
    criteria: CRITERIA.map(c => ({
      key: c.key,
      label: c.label,
      maxScore: c.maxScore,
      description: getCriteriaDescription(c.key)
    })),
    totalMaxScore: CRITERIA.reduce((sum, c) => sum + c.maxScore * c.weight, 0)
  });
});

/**
 * GET /api/scoring/teams/:teamId
 *
 * Get scores for a specific team
 * Requires admin or judge role
 */
router.get('/teams/:teamId', requireAuth, requireRole(['ADMIN', 'JUDGE']), (req, res) => {
  const { teamId } = req.params;
  const teamScores = scores[teamId] || {};

  // Calculate average scores
  const averages = calculateAverages(teamScores);

  // Get judge's own score if logged in
  const judgeScore = teamScores[req.session.user.email] || null;

  res.json({
    teamId,
    criteria: CRITERIA.map(c => ({
      key: c.key,
      label: c.label,
      averageScore: averages[c.key] || 0,
      judgeScore: judgeScore ? judgeScore[c.key] : null
    })),
    totalAverage: averages.total || 0,
    judgeCount: Object.keys(teamScores).length,
    yourScore: judgeScore,
    lastUpdated: averages.lastUpdated
  });
});

/**
 * POST /api/scoring/teams/:teamId
 *
 * Submit scores for a team
 * Requires admin or judge role
 */
router.post('/teams/:teamId', requireAuth, requireRole(['ADMIN', 'JUDGE']), (req, res) => {
  const { teamId } = req.params;
  const { scores: submittedScores } = req.body;
  const judgeEmail = req.session.user.email;

  // Validate scores
  const errors = validateScores(submittedScores);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Initialize team scores if needed
  if (!scores[teamId]) {
    scores[teamId] = {};
  }

  // Store judge's scores
  scores[teamId][judgeEmail] = {
    ...submittedScores,
    timestamp: new Date().toISOString()
  };

  console.log(`[SCORING] ${judgeEmail} scored team ${teamId}:`, submittedScores);

  // Calculate new averages
  const averages = calculateAverages(scores[teamId]);

  res.json({
    success: true,
    message: 'Scores saved successfully',
    teamId,
    yourScore: submittedScores,
    averages: {
      criteria: CRITERIA.map(c => ({ key: c.key, average: averages[c.key] || 0 })),
      total: averages.total
    }
  });
});

/**
 * GET /api/scoring/leaderboard
 *
 * Get all team rankings
 * Requires admin or judge role
 */
router.get('/leaderboard', requireAuth, requireRole(['ADMIN', 'JUDGE']), (req, res) => {
  const leaderboard = [];

  // Iterate through all scored teams
  for (const [teamId, teamScores] of Object.entries(scores)) {
    const averages = calculateAverages(teamScores);
    leaderboard.push({
      teamId,
      averageScore: averages.total || 0,
      judgeCount: Object.keys(teamScores).length,
      criteriaScores: CRITERIA.map(c => ({
        key: c.key,
        label: c.label,
        score: averages[c.key] || 0
      }))
    });
  }

  // Sort by average score descending
  leaderboard.sort((a, b) => b.averageScore - a.averageScore);

  // Add rank
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  res.json({
    leaderboard,
    totalTeams: leaderboard.length,
    criteria: CRITERIA.map(c => ({ key: c.key, label: c.label }))
  });
});

/**
 * GET /api/scoring/judges
 *
 * Get list of judges who have submitted scores
 * Requires admin role
 */
router.get('/judges', requireAuth, requireRole(['ADMIN']), (req, res) => {
  const judgeStats = {};

  // Collect all judges and their score counts
  for (const [teamId, teamScores] of Object.entries(scores)) {
    for (const [judgeEmail, scoreData] of Object.entries(teamScores)) {
      if (!judgeStats[judgeEmail]) {
        judgeStats[judgeEmail] = { email: judgeEmail, teamsScored: 0, lastScore: null };
      }
      judgeStats[judgeEmail].teamsScored++;
      if (!judgeStats[judgeEmail].lastScore || new Date(scoreData.timestamp) > new Date(judgeStats[judgeEmail].lastScore)) {
        judgeStats[judgeEmail].lastScore = scoreData.timestamp;
      }
    }
  }

  res.json({
    judges: Object.values(judgeStats)
  });
});

// Helper functions

function getCriteriaDescription(key) {
  const descriptions = {
    functionality: 'How well does the solution work? Does it achieve its intended purpose?',
    innovation: 'How novel and creative is the approach? Is it innovative?',
    practicality: 'How practical is the solution for real-world implementation?',
    environmentalImpact: 'What positive environmental impact does the solution have?',
    affordability: 'Is the solution cost-effective? Can it be implemented with limited resources?',
    scalability: 'Can the solution be scaled to larger communities, cities, or regions?'
  };
  return descriptions[key] || '';
}

function validateScores(scores) {
  const errors = [];

  if (!scores || typeof scores !== 'object') {
    return ['Scores must be an object'];
  }

  for (const criteria of CRITERIA) {
    const score = scores[criteria.key];
    if (score === undefined || score === null) {
      errors.push(`Missing score for ${criteria.label}`);
    } else if (typeof score !== 'number' || score < 0 || score > criteria.maxScore) {
      errors.push(`${criteria.label} must be a number between 0 and ${criteria.maxScore}`);
    }
  }

  return errors;
}

function calculateAverages(teamScores) {
  const totals = {};
  let judgeCount = 0;
  let lastUpdated = null;

  // Initialize totals
  CRITERIA.forEach(c => totals[c.key] = 0);

  // Sum all scores
  for (const [judgeEmail, scoreData] of Object.entries(teamScores)) {
    judgeCount++;
    CRITERIA.forEach(c => {
      totals[c.key] += scoreData[c.key] || 0;
    });
    if (scoreData.timestamp && (!lastUpdated || new Date(scoreData.timestamp) > new Date(lastUpdated))) {
      lastUpdated = scoreData.timestamp;
    }
  }

  // Calculate averages
  const averages = {};
  CRITERIA.forEach(c => {
    averages[c.key] = judgeCount > 0 ? Math.round((totals[c.key] / judgeCount) * 10) / 10 : 0;
  });

  // Calculate weighted total
  let weightedTotal = 0;
  CRITERIA.forEach(c => {
    weightedTotal += averages[c.key] * c.weight;
  });
  averages.total = Math.round(weightedTotal);
  averages.lastUpdated = lastUpdated;

  return averages;
}

module.exports = router;