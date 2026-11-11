import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('reports ok status with uptime in whole seconds', () => {
    const result = new HealthController().check();

    expect(result.status).toBe('ok');
    expect(Number.isInteger(result.uptime)).toBe(true);
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });
});
