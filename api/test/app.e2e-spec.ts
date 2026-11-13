import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AppOptions, setupApp } from '../src/app.setup.js';
import { TITLE_MAX_LENGTH } from '../src/tasks/dto/create-task.dto.js';

describe('Task Manager API (e2e)', () => {
  let app: NestExpressApplication;
  const log = jest
    .spyOn(Logger.prototype, 'log')
    .mockImplementation(() => undefined);

  const loggedLines = () => log.mock.calls.map(([message]) => String(message));

  const createApp = async (options?: AppOptions) => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    setupApp(app, options);
    await app.init();
  };

  beforeEach(() => log.mockClear());

  afterEach(async () => {
    await app.close();
  });

  describe('endpoints', () => {
    beforeEach(() => createApp());

    it('GET /health returns status, uptime and version', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        uptime: expect.any(Number),
        version: expect.any(String),
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
      ['a missing title', {}, 'title must be a non-empty string'],
      ['a null title', { title: null }, 'title must be a non-empty string'],
      ['a non-string title', { title: 42 }, 'title must be a non-empty string'],
      ['an empty title', { title: '' }, 'title must not be empty'],
      ['a whitespace-only title', { title: '   ' }, 'title must not be empty'],
      [
        'a title over the length limit',
        { title: 'a'.repeat(TITLE_MAX_LENGTH + 1) },
        `title must be at most ${TITLE_MAX_LENGTH} characters`,
      ],
    ])('POST /tasks rejects %s with 400', async (_name, body, message) => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send(body)
        .expect(400);

      expect(response.body.message).toEqual([message]);
      await request(app.getHttpServer()).get('/tasks').expect([]);
    });

    it('POST /tasks accepts a title exactly at the length limit', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'a'.repeat(TITLE_MAX_LENGTH) })
        .expect(201);
    });

    it('POST /tasks rejects malformed JSON with 400', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Content-Type', 'application/json')
        .send('{"title":')
        .expect(400);
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

  describe('request logging', () => {
    beforeEach(() => createApp());

    it('logs successful requests and validation failures', async () => {
      await request(app.getHttpServer()).get('/health').expect(200);
      await request(app.getHttpServer()).post('/tasks').send({}).expect(400);

      expect(loggedLines()).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^GET \/health 200 \d+\.\dms$/),
          expect.stringMatching(/^POST \/tasks 400 \d+\.\dms$/),
        ]),
      );
    });

    it('logs requests rejected before they reach a controller', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Content-Type', 'application/json')
        .send('{"title":')
        .expect(400);
      await request(app.getHttpServer()).get('/').expect(404);
      await request(app.getHttpServer()).get('/unknown').expect(404);

      expect(loggedLines()).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^POST \/tasks 400 /),
          expect.stringMatching(/^GET \/ 404 /),
          expect.stringMatching(/^GET \/unknown 404 /),
        ]),
      );
    });
  });

  describe('with a web directory and a CORS origin', () => {
    let webDir: string;

    beforeEach(async () => {
      webDir = mkdtempSync(join(tmpdir(), 'web-'));
      writeFileSync(join(webDir, 'index.html'), '<h1>Task Manager</h1>');
      await createApp({ webDir, corsOrigin: 'http://localhost:3001' });
    });

    afterEach(() => rmSync(webDir, { recursive: true, force: true }));

    it('serves the frontend and logs the request', async () => {
      const response = await request(app.getHttpServer()).get('/').expect(200);

      expect(response.text).toContain('Task Manager');
      expect(loggedLines()).toEqual(
        expect.arrayContaining([expect.stringMatching(/^GET \/ 200 /)]),
      );
    });

    it('keeps the API reachable next to the static files', async () => {
      await request(app.getHttpServer()).get('/tasks').expect(200).expect([]);
    });

    it('allows the configured origin only', async () => {
      const allowed = await request(app.getHttpServer())
        .get('/tasks')
        .set('Origin', 'http://localhost:3001');
      const other = await request(app.getHttpServer())
        .get('/tasks')
        .set('Origin', 'http://evil.example');

      expect(allowed.headers['access-control-allow-origin']).toBe(
        'http://localhost:3001',
      );
      expect(other.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
