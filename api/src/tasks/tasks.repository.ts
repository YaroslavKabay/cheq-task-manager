import { Task } from './task.entity.js';

export abstract class TasksRepository {
  abstract findAll(): Promise<Task[]>;
  abstract create(task: Task): Promise<Task>;
}
