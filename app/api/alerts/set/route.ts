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
  try {
    const { chatId, type, direction, threshold } = await req.json();
    console.log("Alert set request:", { chatId, type, direction, threshold });
    console.log("Redis URL exists:", !!process.env.KV_REST_API_URL);
    console.log("Redis TOKEN exists:", !!process.env.KV_REST_API_TOKEN);

    const alert: Alert = { chatId, type, direction, threshold, active: true, createdAt: Date.now() };
    await redis.lpush(`alerts:${chatId}`, JSON.stringify(alert));
    console.log("Alert saved to Redis successfully");

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Alert set error:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
