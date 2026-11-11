import { jest } from '@jest/globals';
import { Task } from './task.entity.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

describe('TasksController', () => {
  const task: Task = {
    id: '1',
    title: 'Write tests',
    createdAt: '2026-11-11T10:00:00.000Z',
  };
  const service = {
    findAll: jest.fn<TasksService['findAll']>(),
    create: jest.fn<TasksService['create']>(),
  };
  const controller = new TasksController(service as unknown as TasksService);

  beforeEach(() => jest.resetAllMocks());

  it('lists tasks from the service', async () => {
    service.findAll.mockResolvedValue([task]);

    await expect(controller.findAll()).resolves.toEqual([task]);
  });

  it('delegates creation to the service', async () => {
    service.create.mockResolvedValue(task);

    await expect(controller.create({ title: 'Write tests' })).resolves.toEqual(
      task,
    );
    expect(service.create).toHaveBeenCalledWith({ title: 'Write tests' });
  });
});
