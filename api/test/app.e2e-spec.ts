import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('Task Manager API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health returns status and uptime', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      uptime: expect.any(Number),
    });
  });

  it('GET /tasks returns an empty array when there are no tasks', async () => {
    await request(app.getHttpServer()).get('/tasks').expect(200).expect([]);
  });

  it('POST /tasks creates a task that then appears in the list', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: '  Write the README  ' })
      .expect(201);

    expect(created.body).toEqual({
      id: expect.any(String),
      title: 'Write the README',
      createdAt: expect.any(String),
    });

    await request(app.getHttpServer())
      .get('/tasks')
      .expect(200)
      .expect([created.body]);
  });

  it.each([
    ['a missing title', {}],
    ['an empty title', { title: '' }],
    ['a whitespace-only title', { title: '   ' }],
    ['a non-string title', { title: 42 }],
  ])('POST /tasks rejects %s with 400', async (_name, body) => {
    const response = await request(app.getHttpServer())
      .post('/tasks')
      .send(body)
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('title')]),
    );
    await request(app.getHttpServer()).get('/tasks').expect([]);
  });

  it('POST /tasks ignores unknown fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'Valid', id: 'forced', admin: true })
      .expect(201);

    expect(response.body.id).not.toBe('forced');
    expect(response.body).not.toHaveProperty('admin');
  });
});
