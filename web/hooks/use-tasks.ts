"use client";

import { useCallback, useEffect, useState } from "react";
import { createTask, getTasks, type Task } from "@/lib/api";

type TasksState =
  | { status: "loading"; tasks: Task[]; error: null }
  | { status: "ready"; tasks: Task[]; error: null }
  | { status: "error"; tasks: Task[]; error: string };

const toMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

export function useTasks() {
  const [state, setState] = useState<TasksState>({
    status: "loading",
    tasks: [],
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getTasks(controller.signal)
      .then((tasks) => setState({ status: "ready", tasks, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState((previous) => ({
          status: "error",
          tasks: previous.tasks,
          error: toMessage(error),
        }));
      });

    return () => controller.abort();
  }, [reloadKey]);

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, status: "loading", error: null }));
    setReloadKey((key) => key + 1);
  }, []);

  const addTask = useCallback(
    async (title: string) => {
      await createTask(title);
      reload();
    },
    [reload],
  );

  return { ...state, reload, addTask };
}
