"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

export type HealthStatus = "checking" | "up" | "down";

const POLL_INTERVAL_MS = 5000;
const CHECK_TIMEOUT_MS = 3000;

export function useHealth(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>("checking");

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const check = async () => {
      let next: HealthStatus = "down";
      try {
        const health = await getHealth(AbortSignal.timeout(CHECK_TIMEOUT_MS));
        if (health.status === "ok") next = "up";
      } catch {
        next = "down";
      }
      if (!active) return;
      setStatus(next);
      timer = setTimeout(check, POLL_INTERVAL_MS);
    };

    void check();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  return status;
}
