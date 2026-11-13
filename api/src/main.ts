import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { setupApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  setupApp(app, {
    corsOrigin: process.env.CORS_ORIGIN,
    webDir: process.env.WEB_DIR,
  });

  await app.listen(process.env.PORT || 3000);
}
await bootstrap();
