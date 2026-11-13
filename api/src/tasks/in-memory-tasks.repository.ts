import { Injectable } from '@nestjs/common';
import { Task } from './task.entity.js';
import { TasksRepository } from './tasks.repository.js';

@Injectable()
export class InMemoryTasksRepository extends TasksRepository {
  private readonly tasks: Task[] = [];

  async findAll(): Promise<Task[]> {
    return this.tasks.map((task) => ({ ...task }));
  }

  async create(task: Task): Promise<Task> {
    this.tasks.push({ ...task });
    return { ...task };
  }
}
