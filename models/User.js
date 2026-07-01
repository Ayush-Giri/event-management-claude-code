const db = require('../db/database');

class User {
  constructor(id, name, email, role, created_at) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.created_at = created_at;
  }

  static findByEmail(email) {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row) return null;

    return row; 
  }

  static findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  static create(name, email, passwordHash, role = 'user') {
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, passwordHash, role);
    return result.lastInsertRowid;
  }

  static getAll() {
    return db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all();
  }

  static getStats() {
    return db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get().count;
  }
}

module.exports = User;
