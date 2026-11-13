import type { Task } from "@/lib/api";

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
}

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
}

export function TaskList({ tasks, loading }: TaskListProps) {
  if (loading && tasks.length === 0) {
    return (
      <ul
        aria-busy="true"
        aria-label="Loading tasks"
        className="flex flex-col gap-2"
      >
        {[0, 1, 2].map((item) => (
          <li
            key={item}
            className="h-14 animate-pulse rounded-lg bg-zinc-200/70 dark:bg-zinc-800"
          />
        ))}
      </ul>
    );
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No tasks yet. Add your first one above.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="min-w-0 break-words">{task.title}</span>
          <time
            dateTime={task.createdAt}
            className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
          >
            {formatDate(task.createdAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
