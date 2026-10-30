import type { TokenCandidate } from '@nocturne/shared';

// Mock Scout – emits a few hard‑coded new tokens every run.
// In real version replace with PumpFun / BonkFun WS subscriptions.
export function scoutNewPairs(): TokenCandidate[] {
  const now = Date.now();
  return [
    {
      address: 'TokenA1111111111111111111111111111111111',
      name: 'AlphaToken',
      symbol: 'ALP',
      source: 'PumpFun',
      createdAt: now,
      initialPriceUsd: 0.02,
      initialSolLiquidity: 5,
    },
    {
      address: 'TokenB2222222222222222222222222222222222',
      name: 'BetaToken',
      symbol: 'BET',
      source: 'Raydium',
      createdAt: now,
      initialPriceUsd: 0.015,
      initialSolLiquidity: 3,
    },
  ];
}
