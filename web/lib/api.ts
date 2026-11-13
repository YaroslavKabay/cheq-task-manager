export interface Task {
  id: string;
  title: string;
  createdAt: string;
}

export interface Health {
  status: string;
  uptime: number;
  version: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new Error("Cannot reach the API. Check that it is running.");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as T;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: { message?: string | string[] } = await response.json();
    if (Array.isArray(body.message)) return body.message.join(", ");
    if (body.message) return body.message;
  } catch {
    // non-JSON error body, fall through to the generic message
  }
  return `Request failed with status ${response.status}`;
}

export const getTasks = (signal?: AbortSignal) =>
  request<Task[]>("/tasks", { signal });

export const createTask = (title: string) =>
  request<Task>("/tasks", { method: "POST", body: JSON.stringify({ title }) });

export const getHealth = (signal?: AbortSignal) =>
  request<Health>("/health", { signal });
