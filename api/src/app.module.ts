import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { HealthModule } from './health/health.module.js';
import { TasksModule } from './tasks/tasks.module.js';

@Module({
  imports: [HealthModule, TasksModule],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        stopAtFirstError: true,
      }),
    },
  ],
})
export class AppModule {}
