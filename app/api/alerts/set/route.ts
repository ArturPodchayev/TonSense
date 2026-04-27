import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

interface Alert {
  chatId: number;
  type: "price" | "apy";
  direction: "above" | "below";
  threshold: number;
  active: boolean;
  createdAt: number;
}

export async function POST(req: Request) {
  const { chatId, type, direction, threshold } = await req.json();
  const alert: Alert = { chatId, type, direction, threshold, active: true, createdAt: Date.now() };
  await redis.lpush(`alerts:${chatId}`, JSON.stringify(alert));
  return Response.json({ ok: true });
}
