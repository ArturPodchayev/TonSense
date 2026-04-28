export async function GET() {
  const webhookUrl = `${process.env.NEXT_PUBLIC_WEBAPP_URL ?? "https://tonsense.app"}/api/bot`;
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
  );
  const data = await res.json();
  return Response.json(data);
}
