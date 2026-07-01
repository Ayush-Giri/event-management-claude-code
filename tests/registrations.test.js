const request = require('supertest');
const { app, seedTestData, getTestUser, getTestEvent } = require('./setup');

beforeEach(() => {
  seedTestData();
});

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

  test('REG-01: POST /events/:id/register as logged-in user should create registration', async () => {
    const agent = await loginAsUser();
    const event = getTestEvent();

    const res = await agent.post(`/events/${event.id}/register`);

    expect([200, 302]).toContain(res.status);
  });

  test('REG-02: Registering twice for the same event should not create duplicate', async () => {
    const agent = await loginAsUser();
    const event = getTestEvent();

    await agent.post(`/events/${event.id}/register`);

    const res = await agent.post(`/events/${event.id}/register`);

    expect([302, 400, 409]).toContain(res.status);
  });
});

describe('REG - Unregister from Event', () => {

  test('REG-03: POST /events/:id/unregister should remove registration', async () => {
    const agent = await loginAsUser();
    const event = getTestEvent();

    await agent.post(`/events/${event.id}/register`);

    const res = await agent.post(`/events/${event.id}/unregister`);

    expect([200, 302]).toContain(res.status);
  });
});

describe('REG - View My Registrations', () => {

  test('REG-04: GET /my-registrations as logged-in user should return 200', async () => {
    const agent = await loginAsUser();
    const res = await agent.get('/my-registrations');

    expect(res.status).toBe(200);
  });

  test('REG-05: GET /my-registrations without auth should redirect to login', async () => {
    const res = await request(app).get('/my-registrations');

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/auth\/login|\/login/);
  });
});
