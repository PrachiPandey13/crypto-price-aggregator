import request from 'supertest';
import app from '../src/app';

describe('GET /api/tokens', () => {
  it('responds with JSON and status 200', async () => {
    const res = await request(app).get('/api/tokens');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tokens');
  });

  it('supports query parameters', async () => {
    const res = await request(app).get('/api/tokens?time=1h&sort=volume&limit=2');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tokens');
  });
}); 