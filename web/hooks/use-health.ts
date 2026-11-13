"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

export type HealthStatus = "checking" | "up" | "down";

const POLL_INTERVAL_MS = 5000;

export function useHealth(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>("checking");

  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        const health = await getHealth();
        if (active) setStatus(health.status === "ok" ? "up" : "down");
      } catch {
        if (active) setStatus("down");
      }
    };

    void check();
    const timer = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return status;
}
