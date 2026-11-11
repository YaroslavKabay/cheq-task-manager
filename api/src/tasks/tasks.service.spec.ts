import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { Task } from './task.entity.js';
import { TasksRepository } from './tasks.repository.js';
import { TasksService } from './tasks.service.js';

describe('TasksService', () => {
  const repository = {
    findAll: jest.fn<TasksRepository['findAll']>(),
    create: jest.fn<TasksRepository['create']>(),
  };
  let service: TasksService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TasksRepository, useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(TasksService);
  });

  it('returns the tasks provided by the repository', async () => {
    const stored: Task[] = [
      { id: '1', title: 'Write tests', createdAt: '2026-11-11T10:00:00.000Z' },
    ];
    repository.findAll.mockResolvedValue(stored);

    await expect(service.findAll()).resolves.toEqual(stored);
  });

  it('creates a task with a generated id and creation timestamp', async () => {
    repository.create.mockImplementation(async (task) => task);

    const created = await service.create({ title: 'Ship it' });

    expect(created.title).toBe('Ship it');
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Date(created.createdAt).toISOString()).toBe(created.createdAt);
    expect(repository.create).toHaveBeenCalledWith(created);
  });

  it('gives every task a unique id', async () => {
    repository.create.mockImplementation(async (task) => task);

    const first = await service.create({ title: 'One' });
    const second = await service.create({ title: 'Two' });

    expect(first.id).not.toBe(second.id);
  });

  it('propagates repository failures', async () => {
    repository.create.mockRejectedValue(new Error('storage unavailable'));

    await expect(service.create({ title: 'Fail' })).rejects.toThrow(
      'storage unavailable',
    );
  });
});
