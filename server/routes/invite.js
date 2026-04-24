const express = require('express');
const nodemailer = require('nodemailer');
const config = require('../config');
const store = require('../store');

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// POST /api/events/:id/invite
router.post('/:id/invite', async (req, res) => {
  const event = store.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const { emails } = req.body;
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: 'emails array required' });
  }

  // Update event's invited list (avoid duplicates)
  const currentInvited = event.invitedEmails || [];
  const newInvited = [...new Set([...currentInvited, ...emails])];
  store.updateEvent(event.id, { invitedEmails: newInvited });

  const eventLink = `${config.baseUrl}/event/${event.id}`;

  const mailOptions = {
    from: config.email.user,
    bcc: emails,
    subject: `Invitation: ${event.title}`,
    html: `
      <h2>You're invited to "${event.title}"</h2>
      <p>${event.description}</p>
      <p><strong>When:</strong> ${new Date(event.start).toLocaleString()} – ${new Date(event.end).toLocaleString()}</p>
      <p>Please indicate your availability by clicking the link below:</p>
      <a href="${eventLink}">${eventLink}</a>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Invitations sent', sentTo: emails });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

module.exports = router;