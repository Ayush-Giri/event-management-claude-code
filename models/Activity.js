const db = require('../db/database');

class Activity {
  static getAll() {
    return db.prepare('SELECT * FROM activities ORDER BY name').all();
  }

  static getByEventId(eventId) {
    return db.prepare(`
      SELECT a.* FROM activities a
      JOIN event_activities ea ON a.id = ea.activity_id
      WHERE ea.event_id = ?
    `).all(eventId);
  }

  static getIdsByEventId(eventId) {
    return db.prepare(
      'SELECT activity_id FROM event_activities WHERE event_id = ?'
    ).all(eventId).map(row => row.activity_id);
  }

  static create(name, description) {
    db.prepare(
      'INSERT INTO activities (name, description) VALUES (?, ?)'
    ).run(name, description || null);
  }

  static update(id, name, description) {
    db.prepare(
      'UPDATE activities SET name = ?, description = ? WHERE id = ?'
    ).run(name, description || null, id);
  }

  static delete(id) {
    db.prepare('DELETE FROM activities WHERE id = ?').run(id);
  }

  static getStats() {
    return db.prepare('SELECT COUNT(*) as count FROM activities').get().count;
  }
}

module.exports = Activity;
