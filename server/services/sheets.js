/**
 * Google Sheets Service
 *
 * Handles reading data from Google Sheets (Google Forms responses).
 * Uses Google Service Account authentication.
 *
 * IMPORTANT: This service gracefully handles empty datasets.
 * Data is fetched from Google Sheets where Google Forms automatically
 * stores form responses.
 */

const { google } = require('googleapis');
const config = require('../../config');

// In-memory cache for sheet data
let cache = {
  symposium: { data: null, timestamp: 0 },
  studentChallenge: { data: null, timestamp: 0 }
};

// Create authenticated Google Sheets client
function getSheetsClient() {
  if (!config.google.isConfigured()) {
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.google.serviceAccountEmail,
      private_key: config.google.privateKey
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Fetch data from a Google Sheet
 * @param {string} sheetId - The Google Sheet ID
 * @param {string} range - The cell range (e.g., 'Sheet1!A1:Z')
 * @returns {Promise<Array>} - Array of row objects
 */
async function fetchSheetData(sheetId, range = 'Sheet1!A1:Z') {
  const sheets = getSheetsClient();

  if (!sheets) {
    console.log('Google Sheets not configured - returning empty data');
    return { headers: [], rows: [], empty: true };
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range
    });

    const values = response.data.values || [];

    if (values.length === 0) {
      return { headers: [], rows: [], empty: true };
    }

    // First row is headers
    const headers = values[0];
    const rows = values.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    return { headers, rows, empty: rows.length === 0 };
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error.message);
    return { headers: [], rows: [], error: error.message };
  }
}

/**
 * Get symposium participant data
 * Uses cache with configurable TTL
 */
async function getSymposiumData() {
  const now = Date.now();
  const cacheAge = now - cache.symposium.timestamp;

  // Return cached data if fresh
  if (cache.symposium.data && cacheAge < config.cache.ttlMs) {
    return cache.symposium.data;
  }

  const result = await fetchSheetData(
    config.google.sheetIdSymposium,
    'Sheet1!A1:AC'
  );

  // Update cache
  cache.symposium = {
    data: result,
    timestamp: now
  };

  return result;
}

/**
 * Get student challenge data
 * Uses cache with configurable TTL
 */
async function getStudentChallengeData() {
  const now = Date.now();
  const cacheAge = now - cache.studentChallenge.timestamp;

  // Return cached data if fresh
  if (cache.studentChallenge.data && cacheAge < config.cache.ttlMs) {
    return cache.studentChallenge.data;
  }

  const result = await fetchSheetData(
    config.google.sheetIdStudentChallenge,
    'Sheet1!A1:AF'
  );

  // Update cache
  cache.studentChallenge = {
    data: result,
    timestamp: now
  };

  return result;
}

/**
 * Get sanitized public data for symposium participants
 * Only returns data that should be public
 */
async function getPublicSymposiumData() {
  const data = await getSymposiumData();

  if (data.empty || data.error) {
    return { participants: [], count: 0, empty: data.empty };
  }

  // Map to public-safe fields only
  const participants = data.rows.map(row => ({
    organisation: row['Name of Organisation / Institution / Department'] || '',
    organisationType: row['Organisation Type'] || '',
    state: row['State / UT'] || '',
    registrationType: row['I am registering as:'] || '',
    attending: row['Which day(s) do you plan to attend?'] || '',
    interestedInShowcase: row['Are you interested in the Technology & Start-up Showcase?'] === 'Yes'
  }));

  return {
    participants,
    count: participants.length,
    empty: false
  };
}

/**
 * Get sanitized public data for student teams
 * Only returns data that should be public
 */
async function getPublicStudentTeams() {
  const data = await getStudentChallengeData();

  if (data.empty || data.error) {
    return { teams: [], count: 0, empty: data.empty };
  }

  // Map to public-safe fields only
  const teams = data.rows.map(row => ({
    teamName: row['Team Name'] || '',
    institution: row['Name of School / College / Institution'] || '',
    type: row['Type of Institution'] || '',
    state: row['State / Union Territory'] || '',
    city: row['City / District'] || '',
    category: row['Category'] || '',
    projectTitle: row['Project Title'] || '',
    wasteArea: row['Waste Management Area'] || '',
    status: 'Registered' // Default status until admin updates
  }));

  return {
    teams,
    count: teams.length,
    empty: false
  };
}

/**
 * Get full student team data (for admin/judges only)
 */
async function getAllStudentTeams() {
  const data = await getStudentChallengeData();

  if (data.empty || data.error) {
    return { teams: [], count: 0, empty: data.empty };
  }

  // Return all fields (including personal info - restricted access)
  const teams = data.rows.map(row => ({
    // Team info
    teamName: row['Team Name'] || '',
    category: row['Category'] || '',
    numberOfMembers: row['Number of Team Members'] || '',

    // Institution info
    institution: row['Name of School / College / Institution'] || '',
    institutionType: row['Type of Institution'] || '',
    state: row['State / Union Territory'] || '',
    city: row['City / District'] || '',
    principalName: row['Name of Principal / Head of Institution'] || '',
    institutionEmail: row['Institution Email Address'] || '',
    institutionPhone: row['Institution Contact Number'] || '',

    // Team members (array of objects)
    members: extractMembers(row),

    // Project details
    projectTitle: row['Project Title'] || '',
    wasteArea: row['Waste Management Area'] || '',
    problem: row['Problem Being Addressed'] || '',
    solution: row['Proposed Solution'] || '',
    howItWorks: row['How Does Your Solution Work?'] || '',
    environmentalBenefits: row['Environmental Benefits / Expected Impact'] || '',
    estimatedCost: row['Estimated Project Cost'] || '',
    wasteStream: row['Waste Stream Involved'] || '',
    scalability: row['Scalability'] || '',
    wasteFreeIndiaContribution: row['How does your project contribute towards the vision of Waste-Free India 2035?'] || '',
    projectType: row['What type of working project are you submitting?'] || '',
    tested: row['Has the project/prototype been tested?'] || '',
    testLocation: row['If yes, where has it been tested?'] || '',

    // Timestamps
    submittedAt: row['Timestamp'] || '',

    // Status (for admin)
    status: 'Pending Review'
  }));

  return {
    teams,
    count: teams.length,
    empty: false
  };
}

/**
 * Extract team members from row data
 */
function extractMembers(row) {
  const members = [];

  // Each team can have up to 5 members
  // Member 1
  if (row['Full Name']) {
    members.push({
      name: row['Full Name'] || '',
      age: row['Age'] || '',
      classYear: row['Class / Year of Study'] || '',
      email: row['Email Address'] || '',
      mobile: row['Mobile Number'] || ''
    });
  }

  // Members 2-5 would have different field names based on form structure
  // This is a simplified extraction - actual structure depends on the form

  return members;
}

/**
 * Clear cache (for admin use)
 */
function clearCache() {
  cache.symposium = { data: null, timestamp: 0 };
  cache.studentChallenge = { data: null, timestamp: 0 };
}

module.exports = {
  getSymposiumData,
  getStudentChallengeData,
  getPublicSymposiumData,
  getPublicStudentTeams,
  getAllStudentTeams,
  clearCache,
  isConfigured: () => config.google.isConfigured()
};