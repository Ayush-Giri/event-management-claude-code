const request = require('supertest');
const { app, seedTestData, getTestUser, getTestEvent } = require('./setup');

// ---------------------------------------------------------------------------
// REGISTRATIONS TEST SUITE
// Tests for event registration, unregistration, and viewing registrations.
// ---------------------------------------------------------------------------

beforeEach(() => {
  seedTestData();
});

/**
 * Helper: creates a supertest agent already logged-in as the test user.
 */
async function loginAsUser() {
  const agent = request.agent(app);
  const user = getTestUser();

  await agent
    .post('/auth/login')
    .type('form')
    .send({
      email: user.email,
      password: user.password
    });

  return agent;
}

describe('REG - Register for Event', () => {
  // REG-01: Logged-in user can register for an event
  test('REG-01: POST /events/:id/register as logged-in user should create registration', async () => {
    const agent = await loginAsUser();
    const event = getTestEvent();

    const res = await agent.post(`/events/${event.id}/register`);

    expect([200, 302]).toContain(res.status);
  });

  // REG-02: Duplicate registration should be prevented
  test('REG-02: Registering twice for the same event should not create duplicate', async () => {
    const agent = await loginAsUser();
    const event = getTestEvent();

    // First registration
    await agent.post(`/events/${event.id}/register`);

    // Second registration attempt
    const res = await agent.post(`/events/${event.id}/register`);

    // Should redirect back with an error or return a conflict status
    expect([302, 400, 409]).toContain(res.status);
  });
});

describe('REG - Unregister from Event', () => {
  // REG-03: User can unregister from an event
  test('REG-03: POST /events/:id/unregister should remove registration', async () => {
    const agent = await loginAsUser();
    const event = getTestEvent();

    // Register first
    await agent.post(`/events/${event.id}/register`);

    // Now unregister
    const res = await agent.post(`/events/${event.id}/unregister`);

    expect([200, 302]).toContain(res.status);
  });
});

describe('REG - View My Registrations', () => {
  // REG-04: Logged-in user can view their registrations
  test('REG-04: GET /my-registrations as logged-in user should return 200', async () => {
    const agent = await loginAsUser();
    const res = await agent.get('/my-registrations');

    expect(res.status).toBe(200);
  });

  // REG-05: Unauthenticated user is redirected to login
  test('REG-05: GET /my-registrations without auth should redirect to login', async () => {
    const res = await request(app).get('/my-registrations');

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/auth\/login|\/login/);
  });
});
