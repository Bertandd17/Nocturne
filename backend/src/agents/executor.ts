import type { Position, ThresholdConfig } from '@nocturne/shared';
import { executeRealSwap } from '../swap';
import { SOL_MINT, LAMPORTS_PER_SOL_CONST } from '../swap';

let _nextId = 1;

export async function openPosition(
  tokenAddress: string,
  symbol: string,
  entryPriceUsd: number,
  solBalance: number,
  cfg: ThresholdConfig,
  mode: 'demo' | 'real'
): Promise<Position> {
  const investSol = solBalance * (cfg.maxBalancePerTradePercent / 100);
  const amountToken = investSol / entryPriceUsd;
  const stopLossPriceUsd = entryPriceUsd * (1 + cfg.stopLossPercent / 100);
  let txSignature: string | undefined;
  if (mode === 'real') {
    const sig = await executeRealSwap(
      SOL_MINT,
      tokenAddress,
      Math.floor(investSol * LAMPORTS_PER_SOL_CONST)
    );
    txSignature = sig;
  }
  return {
    id: `pos-${_nextId++}`,
    tokenAddress,
    symbol,
    mode,
    entryPriceUsd,
    currentPriceUsd: entryPriceUsd,
    amountToken,
    investedSol: investSol,
    entryTimestamp: Date.now(),
    stopLossPriceUsd,
    highestPriceUsd: entryPriceUsd,
    trailingActive: false,
    pnlUsd: 0,
    pnlPercent: 0,
    status: 'open',
    txSignature,
  };
}

export async function closePosition(
  pos: Position,
  reason: Position['closedReason'],
  mode: 'demo' | 'real'
): Promise<Position> {
  let txSignature: string | undefined = pos.txSignature;
  if (mode === 'real') {
    // swap token back to SOL
    const sig = await executeRealSwap(
      pos.tokenAddress,
      SOL_MINT,
      Math.floor(pos.amountToken * 1_000_000) // assuming token has 6 decimals, could be improved
    );
    txSignature = sig;
  }
  return {
    ...pos,
    status: 'closed',
    closedReason: reason,
    closedTimestamp: Date.now(),
    txSignature,
  };
}