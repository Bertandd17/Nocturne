import type { KillLogEntry, TokenCandidate } from '@nocturne/shared';

let _logId = 1;

export function recordKill(
  token: TokenCandidate,
  ruleViolated: string,
  details: string
): KillLogEntry {
  return {
    id: `kill-${_logId++}`,
    timestamp: Date.now(),
    tokenAddress: token.address,
    symbol: token.symbol,
    source: token.source,
    ruleViolated,
    details,
  };
}
