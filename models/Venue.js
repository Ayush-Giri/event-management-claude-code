const db = require('../db/database');

class Venue {
  static getAll() {
    return db.prepare('SELECT * FROM venues ORDER BY name').all();
  }

  static getByEventId(eventId) {
    return db.prepare(`
      SELECT v.* FROM venues v
      JOIN event_venues ev ON v.id = ev.venue_id
      WHERE ev.event_id = ?
    `).all(eventId);
  }

  static getIdsByEventId(eventId) {
    return db.prepare(
      'SELECT venue_id FROM event_venues WHERE event_id = ?'
    ).all(eventId).map(row => row.venue_id);
  }

  static create(name, address, capacity) {
    db.prepare(
      'INSERT INTO venues (name, address, capacity) VALUES (?, ?, ?)'
    ).run(name, address || null, capacity || null);
  }

  static update(id, name, address, capacity) {
    db.prepare(
      'UPDATE venues SET name = ?, address = ?, capacity = ? WHERE id = ?'
    ).run(name, address || null, capacity || null, id);
  }

  static delete(id) {
    db.prepare('DELETE FROM venues WHERE id = ?').run(id);
  }

  static getStats() {
    return db.prepare('SELECT COUNT(*) as count FROM venues').get().count;
  }
}

module.exports = Venue;
