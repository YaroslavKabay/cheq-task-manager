import { EventEmitter } from 'node:events';
import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RequestLoggerMiddleware } from './request-logger.middleware.js';

describe('RequestLoggerMiddleware', () => {
  const log = jest
    .spyOn(Logger.prototype, 'log')
    .mockImplementation(() => undefined);

  const createResponse = (statusCode: number, writableFinished = true) =>
    Object.assign(new EventEmitter(), {
      statusCode,
      writableFinished,
    }) as unknown as Response;

  beforeEach(() => log.mockClear());
  afterAll(() => log.mockRestore());

  it('passes the request on without logging before the response ends', () => {
    const next = jest.fn();
    const req = { method: 'GET', originalUrl: '/tasks' } as Request;

    new RequestLoggerMiddleware().use(req, createResponse(200), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(log).not.toHaveBeenCalled();
  });

  it('logs method, path, status code and response time once the response closes', () => {
    const req = { method: 'POST', originalUrl: '/tasks' } as Request;
    const res = createResponse(201);

    new RequestLoggerMiddleware().use(req, res, jest.fn());
    res.emit('close');

    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toMatch(/^POST \/tasks 201 \d+\.\dms$/);
  });

  it('logs the path without the query string', () => {
    const req = {
      method: 'GET',
      originalUrl: '/tasks?token=secret',
    } as Request;
    const res = createResponse(200);

    new RequestLoggerMiddleware().use(req, res, jest.fn());
    res.emit('close');

    expect(log.mock.calls[0][0]).toMatch(/^GET \/tasks 200 /);
  });

  it('marks requests the client dropped before a response was sent', () => {
    const req = { method: 'GET', originalUrl: '/tasks' } as Request;
    const res = createResponse(200, false);

    new RequestLoggerMiddleware().use(req, res, jest.fn());
    res.emit('close');

    expect(log.mock.calls[0][0]).toMatch(/^GET \/tasks aborted \d+\.\dms$/);
  });
});
