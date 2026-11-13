"use client";

import { useEffect, useRef } from "react";
import { ErrorAlert } from "@/components/error-alert";
import { HealthBadge } from "@/components/health-badge";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { useHealth } from "@/hooks/use-health";
import { useTasks } from "@/hooks/use-tasks";

export function TaskManager() {
  const health = useHealth();
  const { tasks, status, error, reload, addTask } = useTasks();

  const previousHealth = useRef(health);
  useEffect(() => {
    const recovered = previousHealth.current === "down" && health === "up";
    previousHealth.current = health;
    if (recovered) reload();
  }, [health, reload]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:py-14">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Task Manager
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {status === "ready"
              ? `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`
              : "Tasks"}
          </p>
        </div>
        <HealthBadge status={health} />
      </header>

      <TaskForm onSubmit={addTask} />

      {status === "error" && error && (
        <ErrorAlert message={error} onRetry={reload} />
      )}

      {(status !== "error" || tasks.length > 0) && (
        <TaskList tasks={tasks} loading={status === "loading"} />
      )}
    </main>
  );
}
