export interface Token {
  symbol: string;
  display_name: string;
  contract_address: string;
  decimals: number;
  kind: string;
  image_url: string;
}

export const TOKENS: Token[] = [
  { symbol: "TON",   display_name: "Toncoin",         contract_address: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",   decimals: 9, kind: "Ton",    image_url: "https://assets.ston.fi/images/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/image.png" },
  { symbol: "USDT",  display_name: "Tether USD",       contract_address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs", decimals: 6, kind: "Jetton", image_url: "https://assets.ston.fi/images/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/image.png" },
  { symbol: "USDC",  display_name: "USD Coin",         contract_address: "EQC61aVMaYWNMNFMDFKHHsAiAWiNDjzfA0KwUyc5UUQBE1Vq", decimals: 6, kind: "Jetton", image_url: "https://assets.ston.fi/images/EQC61aVMaYWNMNFMDFKHHsAiAWiNDjzfA0KwUyc5UUQBE1Vq/image.png" },
  { symbol: "tsTON", display_name: "Tonstakers TON",   contract_address: "EQC98_qAmNEptmzSMQMHMgMKUFSf14sHBSKhHCnIBFqRoGS6",  decimals: 9, kind: "Jetton", image_url: "https://assets.ston.fi/images/EQC98_qAmNEptmzSMQMHMgMKUFSf14sHBSKhHCnIBFqRoGS6/image.png" },
  { symbol: "NOT",   display_name: "Notcoin",          contract_address: "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT",   decimals: 9, kind: "Jetton", image_url: "https://assets.ston.fi/images/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT/image.png" },
  { symbol: "SCALE", display_name: "Ston.fi",          contract_address: "EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE",   decimals: 9, kind: "Jetton", image_url: "https://assets.ston.fi/images/EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE/image.png" },
];
