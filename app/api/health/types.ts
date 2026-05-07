export interface HealthStatus {
  timestamp: number;
  tonPrice:   { ok: boolean; value:   number | null };
  stakingApy: { ok: boolean; value:   number | null };
  deepseek:   { ok: boolean; balance: number | null };
  overall: "ok" | "degraded" | "down";
}
