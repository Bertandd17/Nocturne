import type { TokenCandidate, SecurityCheckResult, ThresholdConfig } from '@nocturne/shared';

// In real version call RugCheck API / Helius RPC for on‑chain checks.
// Here we mock results.
export function runSecurityChecks(
  token: TokenCandidate,
  cfg: ThresholdConfig
): SecurityCheckResult {
  // mock checks
  const mintAuthorityRevoked = true;
  const lpLocked = true;
  const top10HolderPercent = 18; // percent
  const volume1hUsd = 45000;
  const devHasPreviousRug = false;
  const isBundledLaunch = false;

  const passed =
    (cfg.filterRequireMintRevoked ? mintAuthorityRevoked : true) &&
    (cfg.filterRequireLpLocked ? lpLocked : true) &&
    top10HolderPercent <= cfg.filterMaxTop10HolderPercent &&
    volume1hUsd >= cfg.filterMinVolume1hUsd &&
    (cfg.filterRejectDevPreviousRug ? !devHasPreviousRug : true) &&
    (cfg.filterRejectBundledLaunch ? !isBundledLaunch : true);

  let rejectionReason = '';
  if (!passed) {
    const reasons = [];
    if (cfg.filterRequireMintRevoked && !mintAuthorityRevoked) reasons.push('mint authority not revoked');
    if (cfg.filterRequireLpLocked && !lpLocked) reasons.push('LP not locked');
    if (top10HolderPercent > cfg.filterMaxTop10HolderPercent) reasons.push('top10 holders > threshold');
    if (volume1hUsd < cfg.filterMinVolume1hUsd) reasons.push('volume 1h < $40k');
    if (cfg.filterRejectDevPreviousRug && devHasPreviousRug) reasons.push('dev linked to previous rug');
    if (cfg.filterRejectBundledLaunch && isBundledLaunch) reasons.push('bundled launch');
    rejectionReason = reasons.join('; ');
  }

  return {
    mintAuthorityRevoked,
    lpLocked,
    top10HolderPercent,
    volume1hUsd,
    devHasPreviousRug,
    isBundledLaunch,
    passed,
    rejectionReason,
  };
}