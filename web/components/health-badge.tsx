import type { HealthStatus } from "@/hooks/use-health";

const VARIANTS: Record<
  HealthStatus,
  { label: string; badge: string; dot: string }
> = {
  checking: {
    label: "Checking API",
    badge:
      "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    dot: "bg-zinc-400 animate-pulse",
  },
  up: {
    label: "API healthy",
    badge:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  down: {
    label: "API down",
    badge:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
    dot: "bg-red-500",
  },
};

export function HealthBadge({ status }: { status: HealthStatus }) {
  const variant = VARIANTS[status];

  return (
    <span
      role="status"
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${variant.badge}`}
    >
      <span aria-hidden className={`size-2 rounded-full ${variant.dot}`} />
      {variant.label}
    </span>
  );
}
