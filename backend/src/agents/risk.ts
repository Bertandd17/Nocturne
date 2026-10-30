import type { Position, ThresholdConfig } from '@nocturne/shared';

export type RiskDecision =
  | { action: 'hold' }
  | { action: 'close'; reason: 'stop_loss' | 'trailing_stop' };

// Evaluate risk on a position given current price.
export function evaluateRisk(pos: Position, currentPriceUsd: number, cfg: ThresholdConfig): RiskDecision {
  const pnlPercent = ((currentPriceUsd - pos.entryPriceUsd) / pos.entryPriceUsd) * 100;

  // stop loss
  if (currentPriceUsd <= pos.stopLossPriceUsd) {
    return { action: 'close', reason: 'stop_loss' };
  }

  // trailing stop check (must come before trigger update)
  if (pos.trailingActive && pos.trailingStopPriceUsd !== undefined && currentPriceUsd <= pos.trailingStopPriceUsd) {
    return { action: 'close', reason: 'trailing_stop' };
  }

  // trailing stop activation after trigger profit
  if (pnlPercent >= cfg.trailingStopTriggerPercent) {
    const newHighest = Math.max(pos.highestPriceUsd, currentPriceUsd);
    if (newHighest > pos.highestPriceUsd) {
      return { action: 'hold' };
    }
  }

  return { action: 'hold' };
}

// Updates the running trailing‑stop state; returns updated fields.
export function updateTrailing(
  pos: Position,
  currentPriceUsd: number,
  cfg: ThresholdConfig
): Pick<Position, 'highestPriceUsd' | 'trailingActive' | 'trailingStopPriceUsd'> {
  const pnlPercent = ((currentPriceUsd - pos.entryPriceUsd) / pos.entryPriceUsd) * 100;
  const higher = currentPriceUsd > pos.highestPriceUsd;

  if (pnlPercent >= cfg.trailingStopTriggerPercent && higher) {
    return {
      highestPriceUsd: currentPriceUsd,
      trailingActive: true,
      trailingStopPriceUsd: currentPriceUsd * (1 - cfg.trailingStopDeltaPercent / 100),
    };
  }
  return {
    highestPriceUsd: Math.max(pos.highestPriceUsd, currentPriceUsd),
    trailingActive: pos.trailingActive,
    trailingStopPriceUsd: pos.trailingStopPriceUsd,
  };
}
