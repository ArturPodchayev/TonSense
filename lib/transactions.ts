import { toNano, beginCell } from "@ton/core";

// Verify contract address before mainnet use
export function buildStakeTx(amountTon: number) {
  if (amountTon < 1) throw new Error("Minimum stake is 1 TON");

  return {
    validUntil: Math.floor(Date.now() / 1000) + 300,
    messages: [
      {
        address: "EQCkWxfyhAkim3g2DjKQQg8T5P4g-Q1-K_jErGcDJZ4i-vqR",
        amount: toNano(amountTon).toString(),
        // Simple transfer with no payload - Tonstakers detects deposit by amount
      },
    ],
  };
}

// Ston.fi v2 router (mainnet)
const STONFI_ROUTER_V2 = "EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTDSDGCvq3yY7p9q4K";

export function buildSwapTx(amountTon: number) {
  // TON → tsTON swap via Ston.fi v2
  // Direct transfer to router with swap payload; amount + 0.3 TON for gas
  return {
    validUntil: Math.floor(Date.now() / 1000) + 300,
    messages: [
      {
        address: STONFI_ROUTER_V2,
        amount: (toNano(amountTon) + toNano(0.3)).toString(),
        payload: beginCell()
          .storeUint(0x6664de2a, 32) // swap op
          .storeUint(0, 64)
          .endCell()
          .toBoc()
          .toString("base64"),
      },
    ],
  };
}
