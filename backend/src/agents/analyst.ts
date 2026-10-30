import type { TokenCandidate, SecurityCheckResult, AnalystEvaluation, ThresholdConfig } from '@nocturne/shared';

// Deterministic heuristic scoring, 0..1
export function analyzeToken(
  token: TokenCandidate,
  checks: SecurityCheckResult,
  cfg: ThresholdConfig
): AnalystEvaluation {
  const liquidityScore = Math.min(token.initialSolLiquidity / 10, 1);
  const volumeScore = Math.min(checks.volume1hUsd / 100000, 1);
  const holderDistributionScore = 1 - checks.top10HolderPercent / 100;
  const socialSentimentScore = 0.5; // placeholder until social module

  const score =
    0.3 * liquidityScore +
    0.3 * volumeScore +
    0.25 * holderDistributionScore +
    0.15 * socialSentimentScore;

  return {
    tokenAddress: token.address,
    score,
    breakdown: {
      liquidityScore,
      volumeScore,
      holderDistributionScore,
      socialSentimentScore,
    },
    passed: score >= cfg.analystMinScore,
  };
}