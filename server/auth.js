const { google } = require('googleapis');
const config = require('./config');

const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

module.exports = oauth2Client;