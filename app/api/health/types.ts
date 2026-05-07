export interface HealthStatus {
  timestamp: number;
  tonPrice: { ok: boolean; value: number | null };
  stakingApy: { ok: boolean; value: number | null };
  overall: "ok" | "degraded" | "down";
}
