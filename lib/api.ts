export interface PriceData {
  price: number;
  change24h: number;
}

export interface HistoryPoint {
  date: string;
  price: number;
}

export interface StakingApyData {
  apy: number;
  asOf: string;
  source: "live" | "cache";
  cacheTtlSeconds: number;
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

export async function fetchTonPrice(): Promise<PriceData> {
  try {
    const res = await fetch("/api/ton-price");
    if (!res.ok) throw new Error("fetch failed");
    return await res.json();
  } catch {
    return { price: 3.24, change24h: 0 };
  }
}

export async function fetchTonHistory(days: number): Promise<HistoryPoint[]> {
  try {
    const res = await fetch("/api/ton-history");
    if (!res.ok) throw new Error("fetch failed");
    const all: HistoryPoint[] = await res.json();
    return all.slice(-days);
  } catch {
    return [];
  }
}

export async function fetchStakingAPY(): Promise<StakingApyData> {
  const res = await fetch("/api/staking-apy", { cache: "no-store" });
  if (!res.ok) {
    const errorPayload = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    const message = errorPayload?.error?.message ?? "Failed to fetch staking APY";
    throw new Error(message);
  }
  return (await res.json()) as StakingApyData;
}
