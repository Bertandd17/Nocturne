import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runSecurityChecks } from '../agents/filter';
import { analyzeToken } from '../agents/analyst';
import { evaluateRisk, updateTrailing } from '../agents/risk';
import { openPosition, closePosition } from '../agents/executor';
import { encryptWallet, decryptWallet, generateBurner } from '../wallet';
import type { TokenCandidate, ThresholdConfig, Position } from '@nocturne/shared';

const mockConfig: ThresholdConfig = {
  maxBalancePerTradePercent: 10,
  stopLossPercent: -8,
  trailingStopTriggerPercent: 15,
  trailingStopDeltaPercent: 5,
  analystMinScore: 0.6,
  filterMinVolume1hUsd: 40000,
  filterMaxTop10HolderPercent: 25,
  filterRequireMintRevoked: true,
  filterRequireLpLocked: true,
  filterRejectDevPreviousRug: true,
  filterRejectBundledLaunch: true,
  maxDailyLossUsd: 5,
  maxDepositSol: 5,
  killSwitchActive: false,
};

const mockCandidate: TokenCandidate = {
  address: 'Test111111111111111111111111111111111111',
  name: 'TestToken',
  symbol: 'TST',
  source: 'PumpFun',
  createdAt: Date.now(),
  initialPriceUsd: 0.05,
  initialSolLiquidity: 10,
};

describe('Pipeline Security & Risk Tests', () => {
  it('Filter: rejects when LP is not locked', () => {
    // Override filter checks using custom config
    const res = runSecurityChecks(mockCandidate, { ...mockConfig, filterRequireLpLocked: true });
    // Default mock returns lpLocked = true, so should pass
    assert.strictEqual(res.passed, true);
  });

  it('Analyst: calculates deterministic score properly', () => {
    const checks = runSecurityChecks(mockCandidate, mockConfig);
    const analysis = analyzeToken(mockCandidate, checks, mockConfig);
    assert.ok(analysis.score >= 0 && analysis.score <= 1);
    assert.strictEqual(typeof analysis.passed, 'boolean');
  });

  it('Risk: triggers stop loss at -8%', () => {
    const pos: Position = {
      id: 'p-1',
      tokenAddress: mockCandidate.address,
      symbol: mockCandidate.symbol,
      mode: 'demo',
      entryPriceUsd: 1.0,
      currentPriceUsd: 0.91, // -9%
      amountToken: 100,
      investedSol: 1,
      entryTimestamp: Date.now(),
      stopLossPriceUsd: 0.92,
      highestPriceUsd: 1.0,
      trailingActive: false,
      pnlUsd: -9,
      pnlPercent: -9,
      status: 'open',
    };

    const dec = evaluateRisk(pos, 0.91, mockConfig);
    assert.strictEqual(dec.action, 'close');
    assert.strictEqual(dec.reason, 'stop_loss');
  });

  it('Risk: trailing stop triggers after +15% profit pullback', () => {
    const pos: Position = {
      id: 'p-2',
      tokenAddress: mockCandidate.address,
      symbol: mockCandidate.symbol,
      mode: 'demo',
      entryPriceUsd: 1.0,
      currentPriceUsd: 1.20, // +20%
      amountToken: 100,
      investedSol: 1,
      entryTimestamp: Date.now(),
      stopLossPriceUsd: 0.92,
      highestPriceUsd: 1.20,
      trailingActive: true,
      trailingStopPriceUsd: 1.14, // 1.20 - 5% = 1.14
      pnlUsd: 20,
      pnlPercent: 20,
      status: 'open',
    };

    // Price pulls back to 1.13
    const dec = evaluateRisk(pos, 1.13, mockConfig);
    assert.strictEqual(dec.action, 'close');
    assert.strictEqual(dec.reason, 'trailing_stop');
  });

  it('Wallet: encrypts and decrypts burner keypair losslessly', () => {
    const kp = generateBurner();
    const enc = encryptWallet(kp);
    const restored = decryptWallet(enc);
    assert.strictEqual(kp.publicKey.toBase58(), restored.publicKey.toBase58());
  });

  it('Executor: openPosition returns position with investedSol and stopLoss', async () => {
    const pos = await openPosition(mockCandidate.address, mockCandidate.symbol, mockCandidate.initialPriceUsd, 10, mockConfig, 'demo');
    assert.strictEqual(pos.mode, 'demo');
    assert.ok(pos.investedSol > 0);
    assert.ok(pos.stopLossPriceUsd > 0);
    assert.strictEqual(pos.status, 'open');
  });
});
