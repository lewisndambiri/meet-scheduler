const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../store');

const router = express.Router();

// Generate time slots from start/end and type
function generateOptions(type, start, end) {
  const options = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (type === 'full-day') {
    const current = new Date(startDate);
    while (current <= endDate) {
      options.push({
        id: uuidv4(),
        date: current.toISOString().split('T')[0],
        label: current.toISOString().split('T')[0],
      });
      current.setDate(current.getDate() + 1);
    }
  } else {
    const current = new Date(startDate);
    while (current < endDate) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + 60 * 60 * 1000);
      if (slotEnd > endDate) break;
      options.push({
        id: uuidv4(),
        date: slotStart.toISOString().split('T')[0],
        label: `${slotStart.toTimeString().slice(0,5)} - ${slotEnd.toTimeString().slice(0,5)}`,
      });
      current.setTime(current.getTime() + 60 * 60 * 1000);
    }
  }
  return options;
}

// POST /api/events - create event
router.post('/', (req, res) => {
  const { title, description, type, start, end, quorum, invitedEmails } = req.body;
  if (!title || !type || !start || !end) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const options = generateOptions(type, start, end);
  const event = {
    id: uuidv4(),
    title,
    description: description || '',
    type,
    start,
    end,
    quorum: quorum || 1,
    options,
    responses: [],
    invitedEmails: invitedEmails || [],   // <-- NEW
    createdAt: new Date().toISOString(),
  };

  store.addEvent(event);
  res.status(201).json(event);
});

// GET /api/events - list all events
router.get('/', (req, res) => {
  const events = store.getEvents().map(({ id, title, type, start, end, responses }) => ({
    id, title, type, start, end, responseCount: responses.length,
  }));
  res.json(events);
});

// GET /api/events/:id - get single event with stats
router.get('/:id', (req, res) => {
  const event = store.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found' });

  // Compute best option
  const optionScores = {};
  event.options.forEach(opt => { optionScores[opt.id] = 0; });
  event.responses.forEach(r => {
    if (r.status === 'available') optionScores[r.optionId] = (optionScores[r.optionId] || 0) + 1;
  });

  let bestOptionId = null;
  let maxScore = 0;
  for (const [id, score] of Object.entries(optionScores)) {
    if (score > maxScore) {
      maxScore = score;
      bestOptionId = id;
    }
  }

  const quorumReached = maxScore >= (event.quorum || 1);
  const bestOption = quorumReached ? event.options.find(o => o.id === bestOptionId) : null;

  res.json({
    ...event,
    bestOption,
    quorumReached,
    optionScores,
  });
});

// POST /api/events/:id/responses - add/update response
router.post('/:id/responses', (req, res) => {
  const event = store.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found' });

  const { participantName, optionId, status } = req.body;
  if (!participantName || !optionId || !status) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (!['available', 'unavailable', 'maybe'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Remove any previous response by this participant for the same option
  event.responses = event.responses.filter(
    r => !(r.participantName === participantName && r.optionId === optionId)
  );
  event.responses.push({ participantName, optionId, status });
  store.updateEvent(event.id, { responses: event.responses });
  res.json(event);
});

module.exports = router;