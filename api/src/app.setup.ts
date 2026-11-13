import { NestExpressApplication } from '@nestjs/platform-express';
import { RequestLoggerMiddleware } from './common/request-logger.middleware.js';

export interface AppOptions {
  corsOrigin?: string;
  webDir?: string;
}

export function setupApp(
  app: NestExpressApplication,
  options: AppOptions = {},
): void {
  const requestLogger = new RequestLoggerMiddleware();
  app.use(requestLogger.use.bind(requestLogger));

  app.enableShutdownHooks();

  if (options.corsOrigin) {
    app.enableCors({ origin: options.corsOrigin.split(',') });
  }

  if (options.webDir) {
    app.useStaticAssets(options.webDir);
  }
}
