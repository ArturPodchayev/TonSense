export async function GET() {
  try {
    const res = await fetch("https://api.ston.fi/v1/pools", {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`STON.fi ${res.status}`);
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 });
  }
}
