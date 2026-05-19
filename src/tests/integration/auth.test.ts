import request from 'supertest';
import app from '../../app.js';
import pool from '../../config/dbConfig.js';

describe('Auth API', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE users, products RESTART IDENTITY CASCADE');
  });

  it('should register user', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({
        name: 'Test User 2',
        email: 'test2@mail.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toBe(201);
  });

  afterAll(async () => {
    await pool.end();
  });
});