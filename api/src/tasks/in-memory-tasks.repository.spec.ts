import { InMemoryTasksRepository } from './in-memory-tasks.repository.js';
import { Task } from './task.entity.js';

describe('InMemoryTasksRepository', () => {
  const task: Task = {
    id: '1',
    title: 'Write tests',
    createdAt: '2026-11-11T10:00:00.000Z',
  };

  it('starts empty', async () => {
    await expect(new InMemoryTasksRepository().findAll()).resolves.toEqual([]);
  });

  it('stores created tasks in insertion order', async () => {
    const repository = new InMemoryTasksRepository();
    const second = { ...task, id: '2' };

    await repository.create(task);
    await repository.create(second);

    await expect(repository.findAll()).resolves.toEqual([task, second]);
  });

  it('does not expose its internal state', async () => {
    const repository = new InMemoryTasksRepository();
    const input = { ...task };
    const created = await repository.create(input);

    input.title = 'changed input';
    created.title = 'changed result';
    const listed = await repository.findAll();
    listed[0].title = 'changed listing';
    listed.pop();

    await expect(repository.findAll()).resolves.toEqual([task]);
  });
});
