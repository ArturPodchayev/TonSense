export interface PriceData {
  price: number;
  change24h: number;
}

export interface HistoryPoint {
  date: string;
  price: number;
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

export async function fetchStakingAPY(): Promise<number> {
  try {
    const res = await fetch("/api/staking-apy");
    if (!res.ok) throw new Error("fetch failed");
    const data: { apy: number } = await res.json();
    return data.apy;
  } catch {
    return 18.7;
  }
}
