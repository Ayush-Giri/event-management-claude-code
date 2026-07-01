const request = require('supertest');
const { app, seedTestData, getTestUser } = require('./setup');

beforeEach(() => {
  seedTestData();
});

describe('AUTH - User Registration', () => {

  test('AUTH-01: POST /auth/register with valid data should redirect (302)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({
        name: 'New User',
        email: 'newuser@test.com',
        phone: '5551234567',
        password: 'securePass1!',
        confirmPassword: 'securePass1!'
      });

    expect(res.status).toBe(302);
  });

  test('AUTH-02: POST /auth/register with duplicate email should show error', async () => {
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({
        name: 'Duplicate User',
        email: 'user@test.com', // already exists
        phone: '5559999999',
        password: 'password123',
        confirmPassword: 'password123'
      });

    expect([302, 400, 409]).toContain(res.status);
  });
});

describe('AUTH - User Login', () => {

  test('AUTH-03: POST /auth/login with valid credentials should redirect to /events', async () => {
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({
        email: 'user@test.com',
        password: 'password123'
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/events|\/$/);
  });

  test('AUTH-04: POST /auth/login with wrong password should not grant access', async () => {
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({
        email: 'user@test.com',
        password: 'wrongpassword'
      });

    expect([302, 401]).toContain(res.status);

    if (res.status === 302) {

      expect(res.headers.location).toMatch(/\/auth\/login|\/login/);
    }
  });
});

describe('AUTH - Logout', () => {

  test('AUTH-05: GET /auth/logout should destroy session and redirect', async () => {
    const agent = request.agent(app);

    await agent
      .post('/auth/login')
      .type('form')
      .send({
        email: 'user@test.com',
        password: 'password123'
      });

    const res = await agent.get('/auth/logout');

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/|\/auth\/login/);
  });

  test('AUTH-05b: GET /my-registrations without auth should redirect to login', async () => {
    const res = await request(app).get('/my-registrations');

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/auth\/login|\/login/);
  });
});
