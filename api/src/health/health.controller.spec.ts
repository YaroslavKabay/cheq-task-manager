import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('reports ok status with uptime in whole seconds', () => {
    const result = new HealthController().check();

    expect(result.status).toBe('ok');
    expect(Number.isInteger(result.uptime)).toBe(true);
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  describe('version', () => {
    const previous = process.env.APP_VERSION;

    afterEach(() => {
      if (previous === undefined) delete process.env.APP_VERSION;
      else process.env.APP_VERSION = previous;
    });

    it('reports the deployed version', () => {
      process.env.APP_VERSION = 'abc1234';

      expect(new HealthController().check().version).toBe('abc1234');
    });

    it('falls back to dev when no version is set', () => {
      delete process.env.APP_VERSION;

      expect(new HealthController().check().version).toBe('dev');
    });
  });
});
