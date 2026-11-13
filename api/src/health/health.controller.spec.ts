import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('reports ok status with uptime in whole seconds', () => {
    const result = new HealthController().check();

    expect(result.status).toBe('ok');
    expect(Number.isInteger(result.uptime)).toBe(true);
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it('reports the deployed version, falling back to dev', () => {
    const previous = process.env.APP_VERSION;

    process.env.APP_VERSION = 'abc1234';
    expect(new HealthController().check().version).toBe('abc1234');

    delete process.env.APP_VERSION;
    expect(new HealthController().check().version).toBe('dev');

    if (previous !== undefined) process.env.APP_VERSION = previous;
  });
});
