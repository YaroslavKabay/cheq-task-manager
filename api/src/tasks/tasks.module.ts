import { Module } from '@nestjs/common';
import { InMemoryTasksRepository } from './in-memory-tasks.repository.js';
import { TasksController } from './tasks.controller.js';
import { TasksRepository } from './tasks.repository.js';
import { TasksService } from './tasks.service.js';

@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
    { provide: TasksRepository, useClass: InMemoryTasksRepository },
  ],
})
export class TasksModule {}
