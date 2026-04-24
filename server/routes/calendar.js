const express = require('express');
const { google } = require('googleapis');
const oauth2Client = require('../auth');
const store = require('../store');

const router = express.Router();

// GET /api/calendar/availability?eventId=...
router.get('/availability', async (req, res) => {
  const eventId = req.query.eventId;
  if (!eventId) return res.status(400).json({ error: 'eventId required' });

  // Check if we have Google credentials set (from previous auth)
  if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
    return res.status(401).json({ error: 'Not authenticated with Google. Please login first.' });
  }

  const event = store.getEvent(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const freebusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: new Date(event.start).toISOString(),
        timeMax: new Date(event.end).toISOString(),
        items: [{ id: 'primary' }],
      },
    });

    const busyIntervals = freebusy.data.calendars.primary.busy;

    // Map each option to a busy/free status
    const optionsWithBusy = event.options.map(opt => {
      let slotStart, slotEnd;
      if (event.type === 'full-day') {
        slotStart = new Date(opt.date + 'T00:00:00');
        slotEnd = new Date(opt.date + 'T23:59:59');
      } else {
        const [startTime, endTime] = opt.label.split(' - ');
        slotStart = new Date(opt.date + 'T' + startTime + ':00');
        slotEnd = new Date(opt.date + 'T' + endTime + ':00');
      }

      const busy = busyIntervals.some(interval => {
        const busyStart = new Date(interval.start);
        const busyEnd = new Date(interval.end);
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      return { ...opt, busy };
    });

    res.json({ options: optionsWithBusy });
  } catch (err) {
    console.error('Freebusy error:', err);
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

module.exports = router;