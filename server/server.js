const express = require('express');
const cors = require('cors');
const eventsRouter = require('./routes/events');
const authRouter = require('./routes/auth');
const calendarRouter = require('./routes/calendar');
const inviteRouter = require('./routes/invite');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/events', eventsRouter);      // main event CRUD
app.use('/api/events', inviteRouter);      // /api/events/:id/invite

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});