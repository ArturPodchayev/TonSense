import { toNano, beginCell } from "@ton/core";

// Tonstakers liquid staking deposit contract (mainnet)
// Test with small amount first (0.1 TON)
const TONSTAKERS_CONTRACT = "EQCkWxfyhAkim3g2DjKQQg8T5P4g-Q1-K_jErGcDJZ4i-vqR";

export function buildStakeTx(amountTon: number) {
  // Add 0.15 TON gas reserve on top of the stake amount
  const totalNano = toNano(amountTon) + toNano(0.15);
  return {
    validUntil: Math.floor(Date.now() / 1000) + 300,
    messages: [
      {
        address: TONSTAKERS_CONTRACT,
        amount: totalNano.toString(),
        payload: beginCell()
          .storeUint(0x47d54391, 32) // deposit op code
          .storeUint(0, 64)          // query id
          .storeCoins(BigInt(1))     // min expected
          .endCell()
          .toBoc()
          .toString("base64"),
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
