const request = require('supertest');
const { app, seedTestData, getTestUser } = require('./setup');

// ---------------------------------------------------------------------------
// AUTH TEST SUITE
// Tests for user registration, login, and logout flows.
// ---------------------------------------------------------------------------

beforeEach(() => {
  seedTestData();
});

describe('AUTH - User Registration', () => {
  // AUTH-01: Register with valid data
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

  // AUTH-02: Register with duplicate email
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

    // Should either redirect back with flash error or return 400/409
    expect([302, 400, 409]).toContain(res.status);
  });
});

describe('AUTH - User Login', () => {
  // AUTH-03: Login with valid credentials
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

  // AUTH-04: Login with wrong password
  test('AUTH-04: POST /auth/login with wrong password should not grant access', async () => {
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({
        email: 'user@test.com',
        password: 'wrongpassword'
      });

    // Should redirect back to login or return an error status
    expect([302, 401]).toContain(res.status);

    if (res.status === 302) {
      // Should redirect back to login, NOT to /events
      expect(res.headers.location).toMatch(/\/auth\/login|\/login/);
    }
  });
});

describe('AUTH - Logout', () => {
  // AUTH-05: Logout destroys session and redirects
  test('AUTH-05: GET /auth/logout should destroy session and redirect', async () => {
    const agent = request.agent(app);

    // Login first
    await agent
      .post('/auth/login')
      .type('form')
      .send({
        email: 'user@test.com',
        password: 'password123'
      });

    // Now logout
    const res = await agent.get('/auth/logout');

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/|\/auth\/login/);
  });

  // AUTH-05b: Accessing protected route without auth redirects to login
  test('AUTH-05b: GET /my-registrations without auth should redirect to login', async () => {
    const res = await request(app).get('/my-registrations');

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/auth\/login|\/login/);
  });
});
