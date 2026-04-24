const BASE = '/api';

export async function createEvent(data) {
  const res = await fetch(`${BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return res.json();
}

export async function getEvents() {
  const res = await fetch(`${BASE}/events`);
  return res.json();
}

export async function getEvent(id) {
  const res = await fetch(`${BASE}/events/${id}`);
  return res.json();
}

export async function submitResponse(eventId, data) {
  const res = await fetch(`${BASE}/events/${eventId}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}