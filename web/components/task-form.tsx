"use client";

import { useState, type FormEvent } from "react";

const MAX_TITLE_LENGTH = 200;

interface TaskFormProps {
  onSubmit: (title: string) => Promise<void>;
}

function validate(title: string): string | null {
  if (!title) return "Title is required";
  if (title.length > MAX_TITLE_LENGTH) {
    return `Title must be at most ${MAX_TITLE_LENGTH} characters`;
  }
  return null;
}

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = title.trim();
    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setTitle("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not add the task",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
      <label htmlFor="task-title" className="text-sm font-medium">
        New task
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (error) setError(null);
          }}
          placeholder="What needs to be done?"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "task-title-error" : undefined}
          disabled={submitting}
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 aria-invalid:border-red-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add task"}
        </button>
      </div>
      {error && (
        <p
          id="task-title-error"
          role="alert"
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </form>
  );
}
