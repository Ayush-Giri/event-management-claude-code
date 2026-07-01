const db = require('../db/database');

class Event {
  static getAllWithFilters(filters = {}) {
    const { date, venue_id, activity_id } = filters;
    
    let query = `
      SELECT e.*,
        u.name AS creator_name,
        GROUP_CONCAT(DISTINCT v.name) AS venue_names,
        GROUP_CONCAT(DISTINCT a.name) AS activity_names,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS participant_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN event_venues ev ON e.id = ev.event_id
      LEFT JOIN venues v ON ev.venue_id = v.id
      LEFT JOIN event_activities ea ON e.id = ea.event_id
      LEFT JOIN activities a ON ea.activity_id = a.id
    `;
  
    const conditions = [];
    const params = [];
  
    if (date) {
      conditions.push('e.date = ?');
      params.push(date);
    }
  
    if (venue_id) {
      conditions.push('ev.venue_id = ?');
      params.push(venue_id);
    }
  
    if (activity_id) {
      conditions.push('ea.activity_id = ?');
      params.push(activity_id);
    }
  
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
  
    query += ' GROUP BY e.id ORDER BY e.date ASC, e.time ASC';
  
    return db.prepare(query).all(...params);
  }

  static findById(id) {
    return db.prepare(`
      SELECT e.*, u.name AS creator_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(id);
  }

  static create(name, description, date, time, createdBy, venueIds = [], activityIds = []) {
    const transaction = db.transaction(() => {
      const result = db.prepare(
        'INSERT INTO events (name, description, date, time, created_by) VALUES (?, ?, ?, ?, ?)'
      ).run(name, description || null, date, time, createdBy);
  
      const eventId = result.lastInsertRowid;
  
      const insertVenue = db.prepare('INSERT INTO event_venues (event_id, venue_id) VALUES (?, ?)');
      for (const venueId of venueIds) {
        insertVenue.run(eventId, venueId);
      }
  
      const insertActivity = db.prepare('INSERT INTO event_activities (event_id, activity_id) VALUES (?, ?)');
      for (const activityId of activityIds) {
        insertActivity.run(eventId, activityId);
      }

      return eventId;
    });

    return transaction();
  }

  static update(id, name, description, date, time, venueIds = [], activityIds = []) {
    const transaction = db.transaction(() => {
      db.prepare(
        'UPDATE events SET name = ?, description = ?, date = ?, time = ? WHERE id = ?'
      ).run(name, description || null, date, time, id);
  
      db.prepare('DELETE FROM event_venues WHERE event_id = ?').run(id);
      db.prepare('DELETE FROM event_activities WHERE event_id = ?').run(id);
  
      const insertVenue = db.prepare('INSERT INTO event_venues (event_id, venue_id) VALUES (?, ?)');
      for (const venueId of venueIds) {
        insertVenue.run(id, venueId);
      }
  
      const insertActivity = db.prepare('INSERT INTO event_activities (event_id, activity_id) VALUES (?, ?)');
      for (const activityId of activityIds) {
        insertActivity.run(id, activityId);
      }
    });

    transaction();
  }

  static delete(id) {
    db.prepare('DELETE FROM events WHERE id = ?').run(id);
  }

  static getStats() {
    return db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  }
}

module.exports = Event;
