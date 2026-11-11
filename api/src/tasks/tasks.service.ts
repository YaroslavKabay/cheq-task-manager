import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { Task } from './task.entity.js';
import { TasksRepository } from './tasks.repository.js';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  findAll(): Promise<Task[]> {
    return this.tasksRepository.findAll();
  }

  create(dto: CreateTaskDto): Promise<Task> {
    return this.tasksRepository.create({
      id: randomUUID(),
      title: dto.title,
      createdAt: new Date().toISOString(),
    });
  }
}
