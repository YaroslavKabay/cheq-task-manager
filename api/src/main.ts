import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();

  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    app.enableCors({ origin: corsOrigin.split(',') });
  }

  const webDir = process.env.WEB_DIR;
  if (webDir) {
    app.useStaticAssets(webDir);
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
