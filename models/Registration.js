const db = require('../db/database');

class Registration {
  static getByParticipantAndEvent(participantId, eventId) {
    return db.prepare(
      'SELECT id, status FROM registrations WHERE participant_id = ? AND event_id = ?'
    ).get(participantId, eventId);
  }

  static getByParticipant(participantId) {
    return db.prepare(`
      SELECT r.*, e.name AS event_name, e.date AS event_date, e.time AS event_time,
             GROUP_CONCAT(DISTINCT v.name) AS venue_names
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN event_venues ev ON e.id = ev.event_id
      LEFT JOIN venues v ON ev.venue_id = v.id
      WHERE r.participant_id = ?
      GROUP BY r.id
      ORDER BY e.date ASC, e.time ASC
    `).all(participantId);
  }

  static getByEvent(eventId) {
    return db.prepare(`
      SELECT u.id, u.name, u.email, r.registration_date, r.status
      FROM users u
      JOIN registrations r ON u.id = r.participant_id
      WHERE r.event_id = ?
      ORDER BY r.registration_date ASC
    `).all(eventId);
  }

  static register(participantId, eventId) {
    db.prepare(
      'INSERT INTO registrations (participant_id, event_id, status) VALUES (?, ?, ?)'
    ).run(participantId, eventId, 'confirmed');
  }

  static unregister(participantId, eventId) {
    db.prepare(
      'DELETE FROM registrations WHERE participant_id = ? AND event_id = ?'
    ).run(participantId, eventId);
  }
}

module.exports = Registration;
