import request from 'supertest';
import app from '../src/app';

describe('Health check', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
}); 