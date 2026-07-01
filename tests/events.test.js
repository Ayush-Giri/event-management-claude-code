const request = require('supertest');
const { app, seedTestData, getTestAdmin, getTestEvent, getTestVenue } = require('./setup');

beforeEach(() => {
  seedTestData();
});

describe('EVT - Event Listing', () => {

  test('EVT-01: GET /events should return 200 and show event listing', async () => {
    const res = await request(app).get('/events');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Community Meetup');
  });

  test('EVT-02: GET /events/:id should return 200 and show event details', async () => {
    const event = getTestEvent();
    const res = await request(app).get(`/events/${event.id}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Community Meetup');
  });
});

describe('EVT - Event Creation (Admin)', () => {

  test('EVT-03: GET /events/create without auth should redirect to login', async () => {
    const res = await request(app).get('/events/create');

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/auth\/login|\/login/);
  });

  test('EVT-04: POST /events as admin should create event and redirect', async () => {
    const agent = request.agent(app);
    const admin = getTestAdmin();
    const venue = getTestVenue();

    await agent
      .post('/auth/login')
      .type('form')
      .send({
        email: admin.email,
        password: admin.password
      });

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

  test('EVT-05: GET /events?date=2026-08-15 should filter correctly', async () => {
    const res = await request(app).get('/events?date=2026-08-15');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Community Meetup');
  });

  test('EVT-05b: GET /events?date=2099-01-01 should return 200 with no matching events', async () => {
    const res = await request(app).get('/events?date=2099-01-01');

    expect(res.status).toBe(200);

    expect(res.text).not.toContain('Community Meetup');
  });
});

describe('EVT - Event Deletion (Admin)', () => {

  test('EVT-06: POST /events/:id/delete as admin should remove event and redirect', async () => {
    const agent = request.agent(app);
    const admin = getTestAdmin();
    const event = getTestEvent();

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
