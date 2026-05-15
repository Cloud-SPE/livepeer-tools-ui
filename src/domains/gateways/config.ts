export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;
export const DEFAULT_PAYOUTS_LIMIT = 200;

export const LIVEPEER_EXPLORER_GATEWAY_URL = (address: string): string =>
  `https://explorer.livepeer.org/accounts/${address}/history`;
