const TSTON_ADDRESS = "EQC98_qAmNEptmKtduNLnWFM7YQFTMJtE_c7w1Y_03-4jxf5";
// tonstakers launched ~June 2023; used to annualise the cumulative rate
const LAUNCH_DATE = new Date("2023-06-01").getTime();

export async function GET() {
  try {
    const res = await fetch(
      `https://tonapi.io/v2/rates?tokens=${TSTON_ADDRESS}&currencies=TON`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`tonapi ${res.status}`);
    const data = await res.json();
    const rateInTon: number =
      data?.rates?.[TSTON_ADDRESS]?.prices?.TON;
    if (!rateInTon || rateInTon <= 1) throw new Error("unexpected rate");
    const daysSinceLaunch = (Date.now() - LAUNCH_DATE) / 86_400_000;
    const apy = parseFloat(
      (((rateInTon - 1) * 365) / daysSinceLaunch * 100).toFixed(2)
    );
    return Response.json({ apy });
  } catch {
    return Response.json({ apy: 4.2 });
  }
}
