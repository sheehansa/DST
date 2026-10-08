/**
 * Configuration: Google Forms Integration
 * Source: requirements/Formlinks.txt
 *
 * IMPORTANT: These are the authoritative form URLs from the Government of Goa.
 * Do not modify these URLs unless the official forms are changed.
 */

module.exports = {
  // Symposium Participant Registration
  symposium: {
    url: 'https://forms.gle/DZdyhff9dZKCvPhu5',
    name: 'Symposium Participant Registration',
    tagline: 'GOA LEADS THE WAY: KEEP IT SIMPLE',
    // Data fields from CSV (for future backend mapping)
    fields: [
      'Timestamp',
      'Email Address',
      'Full Name',
      'Gender',
      'Age',
      'Mobile Number',
      'Name of Organisation / Institution / Department',
      'Organisation Type',
      'Designation / Position',
      'Department / Division',
      'Organisation Address',
      'City',
      'State / UT',
      'Country',
      'What areas of waste management are you interested in?',
      'I am registering as:',
      'Are you interested in the Technology & Start-up Showcase?',
      'If yes, please provide a brief description of your product / technology / service / innovation.',
      'Would you like to receive information regarding future programmes / initiatives of the Department?',
      'Which day(s) do you plan to attend?',
      'Will you require a participation certificate?',
      'Any specific requirements / accessibility requirements?',
      'Declaration',
      'Consent'
    ]
  },

  // Student Challenge Registration
  studentChallenge: {
    url: 'https://forms.gle/a1y9N1qH6gjGTiiE9',
    name: 'Swachh Bharat 2035 – The Waste-Free India Challenge',
    tagline: 'Student / Team Registration Form',
    deadline: '2026-10-11', // 11 October 2026
    // Data fields from CSV (for future backend mapping)
    fields: [
      'Timestamp',
      'Email Address',
      'Name of School / College / Institution',
      'Type of Institution',
      'State / Union Territory',
      'City / District',
      'Name of Principal / Head of Institution',
      'Institution Email Address',
      'Institution Contact Number',
      'Team Name',
      'Category',
      'Number of Team Members',
      // Team member 1-5 fields (name, age, class, email, mobile each)
      'Full Name',
      'Age',
      'Class / Year of Study',
      'Email Address',
      'Mobile Number',
      // Project fields
      'Project Title',
      'Waste Management Area',
      'Problem Being Addressed',
      'Proposed Solution',
      'How Does Your Solution Work?',
      'Environmental Benefits / Expected Impact',
      'Estimated Project Cost',
      'Waste Stream Involved',
      'Scalability',
      'How does your project contribute towards the vision of Waste-Free India 2035?',
      'What type of working project are you submitting?',
      'Has the project/prototype been tested?',
      'If yes, where has it been tested?',
      'Upload photographs of your prototype/project',
      'Upload project video',
      'Declaration',
      'Consent'
    ]
  },

  // Registration status - both registrations are now OPEN
  status: {
    symposiumOpen: true,      // Symposium registration is LIVE
    challengeOpen: true,      // Student challenge form is LIVE
    // Messages
    openMessage: 'Registration is now open',
    earlyMessage: 'Be among the first to register',
    emptyMessage: 'No registrations have been received yet. Register now to be the first.',
    googleSheetsEmpty: true   // Sheets are empty because registration just opened
  }
};