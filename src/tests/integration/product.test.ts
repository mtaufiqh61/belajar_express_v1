import request from 'supertest';
import app from '../../app.js';
import pool from '../../config/dbConfig.js';

describe('Product API', () => {
  let token: any;

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE users, products RESTART IDENTITY CASCADE');
    // register user
    await request(app).post('/v1/auth/register').send({
      name: 'Test User',
      email: 'test@mail.com',
      password: 'Password123!'
    });

    // login
    const res = await request(app).post('/v1/auth/login').send({
      email: 'test@mail.com',
      password: 'Password123!'
    });

    token = res.body.data.token;
  });

  it('should create product', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Product',
        price: 10000,
        description: 'Test Product Description'
      });

    expect(res.statusCode).toBe(201);
  });

  afterAll(async () => {
    await pool.end();
  });
});