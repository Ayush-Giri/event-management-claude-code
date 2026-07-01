const request = require('supertest');
const { app, seedTestData, getTestAdmin, getTestEvent, getTestVenue } = require('./setup');

// ---------------------------------------------------------------------------
// EVENTS TEST SUITE
// Tests for event listing, detail view, creation, filtering, and deletion.
// ---------------------------------------------------------------------------

beforeEach(() => {
  seedTestData();
});

describe('EVT - Event Listing', () => {
  // EVT-01: List all events
  test('EVT-01: GET /events should return 200 and show event listing', async () => {
    const res = await request(app).get('/events');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Community Meetup');
  });

  // EVT-02: View event detail
  test('EVT-02: GET /events/:id should return 200 and show event details', async () => {
    const event = getTestEvent();
    const res = await request(app).get(`/events/${event.id}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Community Meetup');
  });
});

describe('EVT - Event Creation (Admin)', () => {
  // EVT-03: Create event page requires authentication
  test('EVT-03: GET /events/create without auth should redirect to login', async () => {
    const res = await request(app).get('/events/create');

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/auth\/login|\/login/);
  });

  // EVT-04: Admin can create a new event
  test('EVT-04: POST /events as admin should create event and redirect', async () => {
    const agent = request.agent(app);
    const admin = getTestAdmin();
    const venue = getTestVenue();

    // Login as admin
    await agent
      .post('/auth/login')
      .type('form')
      .send({
        email: admin.email,
        password: admin.password
      });

    // Create event
    const res = await agent
      .post('/events')
      .type('form')
      .send({
        name: 'New Workshop',
        description: 'A brand-new workshop event',
        date: '2026-09-01',
        time: '10:00',
        venues: [venue.id],
        activities: []
      });

    expect([201, 302]).toContain(res.status);
  });
});

describe('EVT - Event Filtering', () => {
  // EVT-05: Filter events by date
  test('EVT-05: GET /events?date=2026-08-15 should filter correctly', async () => {
    const res = await request(app).get('/events?date=2026-08-15');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Community Meetup');
  });

  // EVT-05b: Filter with a date that matches no events
  test('EVT-05b: GET /events?date=2099-01-01 should return 200 with no matching events', async () => {
    const res = await request(app).get('/events?date=2099-01-01');

    expect(res.status).toBe(200);
    // The seeded event should NOT appear
    expect(res.text).not.toContain('Community Meetup');
  });
});

describe('EVT - Event Deletion (Admin)', () => {
  // EVT-06: Admin can delete an event
  test('EVT-06: POST /events/:id/delete as admin should remove event and redirect', async () => {
    const agent = request.agent(app);
    const admin = getTestAdmin();
    const event = getTestEvent();

    // Login as admin
    await agent
      .post('/auth/login')
      .type('form')
      .send({
        email: admin.email,
        password: admin.password
      });

    const res = await agent.post(`/events/${event.id}/delete`);

    expect([200, 302]).toContain(res.status);
  });
});
