const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const mockDb = new Database(':memory:');
mockDb.pragma('journal_mode = WAL');
mockDb.pragma('foreign_keys = ON');

mockDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    image TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS venues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled', 'waitlisted')),
    UNIQUE(participant_id, event_id)
  );

  CREATE TABLE IF NOT EXISTS event_venues (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, venue_id)
  );

  CREATE TABLE IF NOT EXISTS event_activities (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, activity_id)
  );
`);

let testAdmin = null;
let testUser = null;
let testEvent = null;
let testVenue = null;
let testActivity = null;

function seedTestData() {

  mockDb.pragma('foreign_keys = OFF');

  mockDb.exec(`
    DELETE FROM event_activities;
    DELETE FROM event_venues;
    DELETE FROM registrations;
    DELETE FROM events;
    DELETE FROM activities;
    DELETE FROM venues;
    DELETE FROM users;
  `);

  mockDb.pragma('foreign_keys = ON');

  const adminHash = bcrypt.hashSync('password123', 10);
  const adminInsert = mockDb.prepare(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES (?, ?, ?, ?, ?)`
  );
  const adminResult = adminInsert.run('Test Admin', 'admin@test.com', '1234567890', adminHash, 'admin');

  testAdmin = {
    id: Number(adminResult.lastInsertRowid),
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin'
  };

  const userHash = bcrypt.hashSync('password123', 10);
  const userInsert = mockDb.prepare(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES (?, ?, ?, ?, ?)`
  );
  const userResult = userInsert.run('Test User', 'user@test.com', '0987654321', userHash, 'user');

  testUser = {
    id: Number(userResult.lastInsertRowid),
    name: 'Test User',
    email: 'user@test.com',
    password: 'password123',
    role: 'user'
  };

  const venueInsert = mockDb.prepare(
    `INSERT INTO venues (name, address, capacity) VALUES (?, ?, ?)`
  );
  const venueResult = venueInsert.run('Main Hall', '123 University Ave', 200);

  testVenue = {
    id: Number(venueResult.lastInsertRowid),
    name: 'Main Hall',
    address: '123 University Ave',
    capacity: 200
  };

  const activityInsert = mockDb.prepare(
    `INSERT INTO activities (name, description) VALUES (?, ?)`
  );
  const activityResult = activityInsert.run('Workshop', 'Hands-on coding workshop');

  testActivity = {
    id: Number(activityResult.lastInsertRowid),
    name: 'Workshop',
    description: 'Hands-on coding workshop'
  };

  const eventInsert = mockDb.prepare(
    `INSERT INTO events (name, description, date, time, created_by)
     VALUES (?, ?, ?, ?, ?)`
  );
  const eventResult = eventInsert.run(
    'Community Meetup',
    'A fun community event',
    '2026-08-15',
    '14:00',
    testAdmin.id
  );

  testEvent = {
    id: Number(eventResult.lastInsertRowid),
    name: 'Community Meetup',
    description: 'A fun community event',
    date: '2026-08-15',
    time: '14:00'
  };

  mockDb.prepare(`INSERT INTO event_venues (event_id, venue_id) VALUES (?, ?)`)
    .run(testEvent.id, testVenue.id);

  mockDb.prepare(`INSERT INTO event_activities (event_id, activity_id) VALUES (?, ?)`)
    .run(testEvent.id, testActivity.id);
}

jest.mock('../db/database', () => mockDb);

const app = require('../app');

module.exports = {
  app,
  db: mockDb,
  seedTestData,
  getTestAdmin: () => testAdmin,
  getTestUser: () => testUser,
  getTestEvent: () => testEvent,
  getTestVenue: () => testVenue,
  getTestActivity: () => testActivity
};
