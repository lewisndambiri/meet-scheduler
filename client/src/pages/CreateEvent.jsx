import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../api';

function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'time-based',
    start: '',
    end: '',
    quorum: 2,
  });
  const [emailInput, setEmailInput] = useState('');
  const [sendingInvites, setSendingInvites] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const emails = emailInput.split(',').map(e => e.trim()).filter(Boolean);
      const event = await createEvent({ ...form, invitedEmails: emails });
      
      if (emails.length > 0) {
        setSendingInvites(true);
        await fetch(`/api/events/${event.id}/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails }),
        });
        setSendingInvites(false);
      }
      navigate(`/event/${event.id}`);
    } catch (err) {
      alert('Error creating event: ' + err.message);
      setSendingInvites(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Create New Event</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event Title</label>
            <input required className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Team standup, project kickoff..." />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What's this event about?"></textarea>
          </div>
          <div className="form-group">
            <label>Event Type</label>
            <select className="form-control" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="time-based">Time-based (1‑hour slots)</option>
              <option value="full-day">Full-day</option>
            </select>
          </div>
          <div className="flex-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Start</label>
              <input type="datetime-local" required className="form-control" value={form.start} onChange={e => setForm({...form, start: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>End</label>
              <input type="datetime-local" required className="form-control" value={form.end} onChange={e => setForm({...form, end: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Quorum (minimum available votes)</label>
            <input type="number" min="1" className="form-control" value={form.quorum} onChange={e => setForm({...form, quorum: parseInt(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>Invite participants (emails, comma‑separated)</label>
            <input
              type="text"
              className="form-control"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="john@unitn.it, jane@example.com"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={sendingInvites}>
            {sendingInvites ? 'Sending invitations...' : 'Create Event & Send Invites'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;