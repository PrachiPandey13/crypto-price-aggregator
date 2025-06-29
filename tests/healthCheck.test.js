const request = require('supertest');
const app = require('../src/app');

describe('Health check', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});