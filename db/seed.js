const db = require('./database');
const bcryptjs = require('bcryptjs');

// --- Clear all tables in reverse dependency order ---
db.exec(`
  DELETE FROM event_activities;
  DELETE FROM event_venues;
  DELETE FROM registrations;
  DELETE FROM activities;
  DELETE FROM venues;
  DELETE FROM events;
  DELETE FROM users;
`);

// --- Hash passwords ---
const adminHash = bcryptjs.hashSync('admin123', 10);
const userHash = bcryptjs.hashSync('user123', 10);

// --- Insert Users ---
const insertUser = db.prepare(
  'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)'
);

insertUser.run('Admin User', 'admin@example.com', '555-0100', adminHash, 'admin');
insertUser.run('Sarah Johnson', 'sarah.johnson@example.com', '555-0101', userHash, 'user');
insertUser.run('Michael Chen', 'michael.chen@example.com', '555-0102', userHash, 'user');
insertUser.run('Emily Rodriguez', 'emily.rodriguez@example.com', '555-0103', userHash, 'user');

// --- Insert Venues ---
const insertVenue = db.prepare(
  'INSERT INTO venues (name, address, capacity) VALUES (?, ?, ?)'
);

insertVenue.run('Riverside Community Center', '450 River Road, Springfield, IL 62701', 300);
insertVenue.run('Oakwood Public Library Hall', '123 Oak Avenue, Springfield, IL 62702', 150);
insertVenue.run('Downtown Convention Center', '789 Main Street, Springfield, IL 62703', 500);
insertVenue.run('Maplewood Park Pavilion', '56 Maple Drive, Springfield, IL 62704', 200);
insertVenue.run('Heritage Arts Theater', '321 Heritage Lane, Springfield, IL 62705', 350);
insertVenue.run('Lakeview Sports Complex', '900 Lakeshore Boulevard, Springfield, IL 62706', 450);

// --- Insert Activities ---
const insertActivity = db.prepare(
  'INSERT INTO activities (name, description) VALUES (?, ?)'
);

insertActivity.run('Workshop', 'Hands-on learning sessions led by industry experts covering practical skills and techniques.');
insertActivity.run('Guest Talk', 'Inspiring presentations from renowned speakers sharing insights and experiences.');
insertActivity.run('Panel Discussion', 'Moderated conversations with multiple experts exploring diverse perspectives on key topics.');
insertActivity.run('Networking Session', 'Structured social interactions designed to foster professional connections and community building.');
insertActivity.run('Live Music', 'Live musical performances featuring local and regional artists across various genres.');
insertActivity.run('Art Exhibition', 'Curated displays of visual artwork from community artists and creative collectives.');
insertActivity.run('Food Festival', 'Culinary showcases featuring local chefs, food vendors, and cultural cuisine demonstrations.');
insertActivity.run('Sports Tournament', 'Competitive and recreational sporting events promoting fitness and team spirit.');

// --- Insert Events ---
const insertEvent = db.prepare(
  'INSERT INTO events (name, description, date, time, created_by) VALUES (?, ?, ?, ?, ?)'
);

// Admin user id = 1
insertEvent.run(
  'Summer Community Festival',
  'A vibrant celebration of our community featuring live entertainment, local food vendors, art displays, and family-friendly activities throughout the day.',
  '2026-07-15', '10:00', 1
);
insertEvent.run(
  'Tech Innovation Workshop Series',
  'An immersive workshop series exploring the latest in technology, from AI and machine learning to web development and cybersecurity best practices.',
  '2026-07-22', '09:00', 1
);
insertEvent.run(
  'Annual Charity Gala',
  'An elegant evening fundraiser supporting local education initiatives, featuring guest speakers, a silent auction, gourmet dining, and live performances.',
  '2026-08-05', '18:00', 1
);
insertEvent.run(
  'Youth Sports Championship',
  'A day-long multi-sport tournament for young athletes aged 10-18, promoting sportsmanship, teamwork, and healthy competition.',
  '2026-08-12', '08:00', 1
);
insertEvent.run(
  'Autumn Arts & Culture Fair',
  'A celebration of artistic expression showcasing local painters, sculptors, musicians, and performers in an outdoor festival setting.',
  '2026-09-20', '11:00', 1
);
insertEvent.run(
  'Professional Networking Mixer',
  'An evening of structured networking opportunities for local professionals, entrepreneurs, and business leaders to exchange ideas and build partnerships.',
  '2026-10-03', '17:30', 1
);
insertEvent.run(
  'Community Health & Wellness Expo',
  'A comprehensive health fair offering free screenings, fitness demonstrations, nutrition workshops, and mental health awareness sessions.',
  '2026-06-10', '09:00', 1
);
insertEvent.run(
  'Holiday Market & Craft Show',
  'A festive marketplace featuring handmade crafts, artisan goods, seasonal treats, and live holiday entertainment for the whole family.',
  '2026-12-13', '10:00', 1
);

// --- Link Events to Venues ---
const insertEventVenue = db.prepare(
  'INSERT INTO event_venues (event_id, venue_id) VALUES (?, ?)'
);

// Event 1: Summer Community Festival → Riverside Community Center + Maplewood Park Pavilion
insertEventVenue.run(1, 1);
insertEventVenue.run(1, 4);

// Event 2: Tech Innovation Workshop → Oakwood Public Library Hall
insertEventVenue.run(2, 2);

// Event 3: Annual Charity Gala → Heritage Arts Theater + Downtown Convention Center
insertEventVenue.run(3, 5);
insertEventVenue.run(3, 3);

// Event 4: Youth Sports Championship → Lakeview Sports Complex + Maplewood Park Pavilion
insertEventVenue.run(4, 6);
insertEventVenue.run(4, 4);

// Event 5: Autumn Arts & Culture Fair → Heritage Arts Theater
insertEventVenue.run(5, 5);

// Event 6: Professional Networking Mixer → Downtown Convention Center
insertEventVenue.run(6, 3);

// Event 7: Community Health & Wellness Expo → Riverside Community Center + Lakeview Sports Complex
insertEventVenue.run(7, 1);
insertEventVenue.run(7, 6);

// Event 8: Holiday Market & Craft Show → Downtown Convention Center + Oakwood Public Library Hall
insertEventVenue.run(8, 3);
insertEventVenue.run(8, 2);

// --- Link Events to Activities ---
const insertEventActivity = db.prepare(
  'INSERT INTO event_activities (event_id, activity_id) VALUES (?, ?)'
);

// Event 1: Summer Community Festival → Live Music, Food Festival, Art Exhibition
insertEventActivity.run(1, 5);
insertEventActivity.run(1, 7);
insertEventActivity.run(1, 6);

// Event 2: Tech Innovation Workshop → Workshop, Guest Talk, Panel Discussion
insertEventActivity.run(2, 1);
insertEventActivity.run(2, 2);
insertEventActivity.run(2, 3);

// Event 3: Annual Charity Gala → Guest Talk, Live Music, Networking Session
insertEventActivity.run(3, 2);
insertEventActivity.run(3, 5);
insertEventActivity.run(3, 4);

// Event 4: Youth Sports Championship → Sports Tournament, Workshop
insertEventActivity.run(4, 8);
insertEventActivity.run(4, 1);

// Event 5: Autumn Arts & Culture Fair → Art Exhibition, Live Music, Workshop
insertEventActivity.run(5, 6);
insertEventActivity.run(5, 5);
insertEventActivity.run(5, 1);

// Event 6: Professional Networking Mixer → Networking Session, Guest Talk, Panel Discussion
insertEventActivity.run(6, 4);
insertEventActivity.run(6, 2);
insertEventActivity.run(6, 3);

// Event 7: Community Health & Wellness Expo → Workshop, Panel Discussion
insertEventActivity.run(7, 1);
insertEventActivity.run(7, 3);

// Event 8: Holiday Market & Craft Show → Art Exhibition, Food Festival, Live Music
insertEventActivity.run(8, 6);
insertEventActivity.run(8, 7);
insertEventActivity.run(8, 5);

// --- Create Registrations ---
const insertRegistration = db.prepare(
  'INSERT INTO registrations (participant_id, event_id, status) VALUES (?, ?, ?)'
);

// Sarah Johnson (id=2) → Events 1, 3, 5
insertRegistration.run(2, 1, 'confirmed');
insertRegistration.run(2, 3, 'confirmed');
insertRegistration.run(2, 5, 'confirmed');

// Michael Chen (id=3) → Events 2, 4, 6
insertRegistration.run(3, 2, 'confirmed');
insertRegistration.run(3, 4, 'confirmed');
insertRegistration.run(3, 6, 'confirmed');

// Emily Rodriguez (id=4) → Events 1, 2, 8
insertRegistration.run(4, 1, 'confirmed');
insertRegistration.run(4, 2, 'confirmed');
insertRegistration.run(4, 8, 'confirmed');

console.log('Database seeded successfully!');
console.log('   - 1 admin user (admin@example.com / admin123)');
console.log('   - 3 regular users (password: user123)');
console.log('   - 6 venues');
console.log('   - 8 activities');
console.log('   - 8 events');
console.log('   - Event-venue and event-activity links created');
console.log('   - 9 registrations created');

db.close();
