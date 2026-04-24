const express = require('express');
const oauth2Client = require('../auth');
const config = require('../config');

const router = express.Router();

// Start the Google OAuth flow
router.get('/google', (req, res) => {
  const eventId = req.query.eventId || '';
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    state: eventId,  // passed back to callback
  });
  res.redirect(url);
});

// Callback after user grants permission
router.get('/google/callback', async (req, res) => {
  const { code, state: eventId } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // In a real app store tokens in DB. For demo, keep them in memory.
    console.log('Google tokens received and set');
    res.redirect(`${config.baseUrl}/event/${eventId}?googleAuth=success`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${config.baseUrl}/event/${eventId}?googleAuth=error`);
  }
});

module.exports = router;