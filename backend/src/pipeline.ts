import { scoutNewPairs } from './agents/scout';
import { runSecurityChecks } from './agents/filter';
import { analyzeToken } from './agents/analyst';
import { openPosition, closePosition } from './agents/executor';
import { evaluateRisk, updateTrailing } from './agents/risk';
import { recordKill } from './agents/logger';
import type {
  ThresholdConfig,
  Position,
  KillLogEntry,
  AgentInfo,
  TradingMode,
} from '@nocturne/shared';

export interface PipelineState {
  mode: TradingMode;
  config: ThresholdConfig;
  positions: Position[];
  killLog: KillLogEntry[];
  demoBalanceSol: number;
  agents: AgentInfo[];
}

export class PipelineManager {
  private state: PipelineState;
  private timer: NodeJS.Timeout | null = null;
  private wsBroadcast: (msg: any) => void;

  constructor(broadcast: (msg: any) => void) {
    this.wsBroadcast = broadcast;
    this.state = {
      mode: 'demo',
      demoBalanceSol: 10,
      config: {
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
      },
      positions: [],
      killLog: [],
      agents: [
        { name: 'scout', status: 'idle', lastActive: Date.now(), processedCount: 0 },
        { name: 'filter', status: 'idle', lastActive: Date.now(), processedCount: 0 },
        { name: 'analyst', status: 'idle', lastActive: Date.now(), processedCount: 0 },
        { name: 'executor', status: 'idle', lastActive: Date.now(), processedCount: 0 },
        { name: 'risk', status: 'idle', lastActive: Date.now(), processedCount: 0 },
        { name: 'logger', status: 'idle', lastActive: Date.now(), processedCount: 0 },
      ],
    };
  }

  public getState() {
    return this.state;
  }

  public setConfig(cfg: Partial<ThresholdConfig>) {
    this.state.config = { ...this.state.config, ...cfg };
    this.wsBroadcast({ type: 'config_updated', config: this.state.config });
  }

  public setMode(mode: TradingMode) {
    this.state.mode = mode;
    this.wsBroadcast({ type: 'mode_changed', mode });
  }

  public start(intervalMs = 10000) {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), intervalMs);
    this.setAgentStatus('scout', 'running');
  }

  public stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private setAgentStatus(name: AgentInfo['name'], status: AgentInfo['status'], msg?: string) {
    this.state.agents = this.state.agents.map((a) =>
      a.name === name ? { ...a, status, lastActive: Date.now(), message: msg } : a
    );
    this.wsBroadcast({ type: 'agent_status', agents: this.state.agents });
  }

  private bumpAgentCount(name: AgentInfo['name']) {
    this.state.agents = this.state.agents.map((a) =>
      a.name === name ? { ...a, processedCount: a.processedCount + 1 } : a
    );
  }

  public async tick() {
    if (this.state.config.killSwitchActive) {
      return;
    }

    // 1. Scout
    this.setAgentStatus('scout', 'running');
    const candidates = scoutNewPairs();
    this.bumpAgentCount('scout');
    this.setAgentStatus('scout', 'idle');

    for (const cand of candidates) {
      this.wsBroadcast({ type: 'scouted', token: cand });

      // 2. Filter
      this.setAgentStatus('filter', 'running');
      const checks = runSecurityChecks(cand, this.state.config);
      this.bumpAgentCount('filter');
      this.setAgentStatus('filter', 'idle');

      if (!checks.passed) {
        // 6. Logger agent records kill
        this.setAgentStatus('logger', 'running');
        const kill = recordKill(cand, 'Security Filter', checks.rejectionReason || 'Failed filter');
        this.state.killLog.unshift(kill);
        this.bumpAgentCount('logger');
        this.setAgentStatus('logger', 'idle');
        this.wsBroadcast({ type: 'killed', kill });
        continue;
      }

      // 3. Analyst
      this.setAgentStatus('analyst', 'running');
      const analysis = analyzeToken(cand, checks, this.state.config);
      this.bumpAgentCount('analyst');
      this.setAgentStatus('analyst', 'idle');

      if (!analysis.passed) {
        this.setAgentStatus('logger', 'running');
        const kill = recordKill(
          cand,
          'Analyst Score',
          `Score ${analysis.score.toFixed(2)} < ${this.state.config.analystMinScore}`
        );
        this.state.killLog.unshift(kill);
        this.bumpAgentCount('logger');
        this.setAgentStatus('logger', 'idle');
        this.wsBroadcast({ type: 'killed', kill });
        continue;
      }

      // 4. Executor
      this.setAgentStatus('executor', 'running');
      const pos = await openPosition(
        cand.address,
        cand.symbol,
        cand.initialPriceUsd,
        this.state.demoBalanceSol,
        this.state.config,
        this.state.mode
      );
      this.state.positions.unshift(pos);
      this.state.demoBalanceSol -= pos.investedSol;
      this.bumpAgentCount('executor');
      this.setAgentStatus('executor', 'idle');
      this.wsBroadcast({ type: 'position_opened', position: pos });
    }

    // 5. Risk agent monitors active positions
    this.setAgentStatus('risk', 'running');
    for (let i = 0; i < this.state.positions.length; i++) {
      const pos = this.state.positions[i];
      if (pos.status !== 'open') continue;

      // Mock slight price fluctuation in demo mode
      const delta = (Math.random() - 0.48) * 0.05;
      const currentPriceUsd = Math.max(0.0001, pos.currentPriceUsd * (1 + delta));
      pos.currentPriceUsd = currentPriceUsd;

      // Check trailing stops update
      const trailing = updateTrailing(pos, currentPriceUsd, this.state.config);
      pos.highestPriceUsd = trailing.highestPriceUsd;
      pos.trailingActive = trailing.trailingActive;
      pos.trailingStopPriceUsd = trailing.trailingStopPriceUsd;

      // evaluate risk
      const dec = evaluateRisk(pos, currentPriceUsd, this.state.config);
      if (dec.action === 'close') {
        const closed = await closePosition(pos, dec.reason, this.state.mode);
        this.state.positions[i] = closed;
        // return capital + pnl back to demo balance
        if (this.state.mode === 'demo') {
          const exitSol = pos.investedSol * (currentPriceUsd / pos.entryPriceUsd);
          this.state.demoBalanceSol += exitSol;
        }
        this.wsBroadcast({ type: 'position_closed', position: closed });
      }
    }
    this.bumpAgentCount('risk');
    this.setAgentStatus('risk', 'idle');
  }

  public async manualClose(posId: string) {
    const idx = this.state.positions.findIndex((p) => p.id === posId);
    if (idx !== -1 && this.state.positions[idx].status === 'open') {
      const pos = this.state.positions[idx];
      const closed = await closePosition(pos, 'manual', this.state.mode);
      this.state.positions[idx] = closed;
      if (this.state.mode === 'demo') {
        const exitSol = pos.investedSol * (pos.currentPriceUsd / pos.entryPriceUsd);
        this.state.demoBalanceSol += exitSol;
      }
      this.wsBroadcast({ type: 'position_closed', position: closed });
    }
  }

  public resetDemoBalance(sol = 10) {
    this.state.demoBalanceSol = sol;
    this.state.positions = [];
    this.wsBroadcast({ type: 'balance_reset', balanceSol: sol });
  }
}
