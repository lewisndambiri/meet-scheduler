const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

class Store {
  constructor() {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ events: [] }));
    }
    this.data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }

  save() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
  }

  getEvents() {
    return this.data.events;
  }

  getEvent(id) {
    return this.data.events.find(e => e.id === id);
  }

  addEvent(event) {
    this.data.events.push(event);
    this.save();
    return event;
  }

  updateEvent(id, updates) {
    const index = this.data.events.findIndex(e => e.id === id);
    if (index === -1) return null;
    this.data.events[index] = { ...this.data.events[index], ...updates };
    this.save();
    return this.data.events[index];
  }
}

module.exports = new Store();