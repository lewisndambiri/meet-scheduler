import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../api';

function Home() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    getEvents().then(setEvents).catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Upcoming Events</h1>
      {events.length === 0 && (
        <div className="card">
          <p className="text-muted">No events yet. <Link to="/create">Create your first one!</Link></p>
        </div>
      )}
      {events.map(ev => (
        <div key={ev.id} className="event-card">
          <h2><Link to={`/event/${ev.id}`}>{ev.title}</Link></h2>
          <div className="event-meta">
            <span>🗓 {ev.type === 'full-day' ? 'Full-day' : 'Time-based'}</span>
            <span>⏰ {new Date(ev.start).toLocaleDateString()} – {new Date(ev.end).toLocaleDateString()}</span>
            <span>👥 {ev.responseCount} response(s)</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Home;