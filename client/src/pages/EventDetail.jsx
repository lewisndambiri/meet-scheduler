import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEvent, submitResponse } from '../api';

function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [name, setName] = useState('');
  const [googleMsg, setGoogleMsg] = useState('');
  const [calendarOptions, setCalendarOptions] = useState(null);

  const fetchEvent = () => getEvent(id).then(setEvent);

  useEffect(() => {
    fetchEvent();
    // Check for Google auth callback status
    const params = new URLSearchParams(window.location.search);
    if (params.get('googleAuth') === 'success') {
      setGoogleMsg('Google Calendar synced successfully!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('googleAuth') === 'error') {
      setGoogleMsg('Google authentication failed.');
    }
  }, [id]);

  const handleOptionClick = (optionId, currentStatus) => {
    if (!name.trim()) {
      alert('Please enter your name first');
      return;
    }
    const statusCycle = ['available', 'maybe', 'unavailable'];
    const nextStatus = currentStatus
      ? statusCycle[(statusCycle.indexOf(currentStatus) + 1) % statusCycle.length]
      : 'available';

    submitResponse(id, {
      participantName: name.trim(),
      optionId,
      status: nextStatus,
    }).then(updatedEvent => {
      setEvent(updatedEvent);
    });
  };

  // Connect to Google (for creator)
  const connectGoogle = () => {
    window.location.href = `/api/auth/google?eventId=${id}`;
  };

  // Fetch Google Calendar availability
  const fetchCalendarAvailability = async () => {
    try {
      const res = await fetch(`/api/calendar/availability?eventId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setCalendarOptions(data.options);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to fetch calendar');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  if (!event) return <div className="card">Loading...</div>;

  const { options, responses, bestOption, quorumReached, optionScores } = event;

  // Build a map of participantName -> (optionId -> status)
  const responseMap = {};
  responses.forEach(r => {
    if (!responseMap[r.participantName]) responseMap[r.participantName] = {};
    responseMap[r.participantName][r.optionId] = r.status;
  });
  const participantNames = Object.keys(responseMap);

  // Merge calendar busy info into options for display
  const displayOptions = calendarOptions || options;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{event.title}</h1>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
        {event.description || 'No description'}
      </p>

      <div className="flex-row" style={{ marginBottom: '1.5rem' }}>
        <span><strong>Type:</strong> {event.type === 'full-day' ? 'Full-day' : 'Time-based'}</span>
        <span><strong>Quorum:</strong> {event.quorum}</span>
        <span>
          <strong>Period:</strong>{' '}
          {new Date(event.start).toLocaleString()} – {new Date(event.end).toLocaleString()}
        </span>
      </div>

      {quorumReached && bestOption && (
        <div className="best-slot-alert">
          <span style={{ fontSize: '1.5rem' }}>🎉</span>
          <div>
            <strong>Best time slot found!</strong> {bestOption.date} {bestOption.label}{' '}
            with {optionScores[bestOption.id]} votes.
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex-row" style={{ marginBottom: '1rem' }}>
          <button className="btn btn-secondary" onClick={connectGoogle}>
            🔗 Connect Google Calendar
          </button>
          <button className="btn btn-secondary" onClick={fetchCalendarAvailability}>
            📊 Show My Availability
          </button>
        </div>
        {googleMsg && <p className="text-muted">{googleMsg}</p>}
        {calendarOptions && (
          <p className="text-muted">Calendar data loaded. Red borders = busy slots.</p>
        )}

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Your name</label>
          <input
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name to vote"
            style={{ maxWidth: '300px' }}
          />
        </div>
      </div>

      <h2 className="section-title">📅 Available Time Slots</h2>
      <div className="option-grid">
        {displayOptions.map(opt => {
          const myStatus = responseMap[name.trim()]?.[opt.id];
          const isBusy = opt.busy;   // from calendar data
          return (
            <div
              key={opt.id}
              className={`option-cell ${myStatus || ''} ${bestOption?.id === opt.id ? 'best-slot' : ''}`}
              style={isBusy ? { borderColor: '#d32f2f', borderWidth: '2px' } : {}}
              onClick={() => handleOptionClick(opt.id, myStatus)}
            >
              <div>{opt.date}</div>
              {event.type === 'time-based' && <div>{opt.label}</div>}
              {myStatus && <span className="status-label">{myStatus}</span>}
              {isBusy && <span className="calendar-busy-indicator">BUSY</span>}
            </div>
          );
        })}
      </div>

      <h2 className="section-title">👥 Responses</h2>
      {participantNames.length === 0 && (
        <p className="text-muted">No responses yet. Be the first!</p>
      )}
      {participantNames.map(pName => (
        <div key={pName} className="response-participant">
          <strong>{pName}</strong>
          <div className="option-grid" style={{ marginTop: '0.5rem' }}>
            {options.map(opt => {
              const status = responseMap[pName]?.[opt.id];
              return (
                <div key={opt.id} className={`option-cell ${status || ''}`}>
                  {status ? status : '–'}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default EventDetail;