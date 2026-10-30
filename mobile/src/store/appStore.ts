import { create } from 'zustand';
import type { AgentInfo, Position, ThresholdConfig, WalletState, KillLogEntry, TradingMode, AppStatePayload } from '@nocturne/shared';

interface AppStore {
  mode: TradingMode;
  agents: AgentInfo[];
  wallet: WalletState;
  positions: Position[];
  config: ThresholdConfig;
  killLog: KillLogEntry[];
  liveFeed: { ts: number; type: string; message: string; tokenAddress?: string; symbol?: string }[];
  pnl24hUsd: number;
  pnl24hPercent: number;

  setMode: (mode: TradingMode) => void;
  setAgents: (agents: AgentInfo[]) => void;
  updateAgent: (name: AgentInfo['name'], update: Partial<AgentInfo>) => void;
  setPositions: (positions: Position[]) => void;
  addPosition: (pos: Position) => void;
  updatePosition: (id: string, update: Partial<Position>) => void;
  removePosition: (id: string) => void;
  setConfig: (config: ThresholdConfig) => void;
  setWallet: (wallet: Partial<WalletState>) => void;
  addKillLog: (entry: KillLogEntry) => void;
  pushFeed: (entry: { type: string; message: string; tokenAddress?: string; symbol?: string }) => void;
  setPnl: (usd: number, percent: number) => void;
}

const defaultWallet: WalletState = {
  mode: 'demo',
  connected: false,
  userAddress: null,
  balanceSol: 10,
  tradingWalletAddress: null,
  tradingWalletBalanceSol: 0,
  demoDaysActive: 0,
  realUnlocked: false,
};

const defaultConfig: ThresholdConfig = {
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

export const useAppStore = create<AppStore>((set) => ({
  mode: 'demo',
  agents: [],
  wallet: defaultWallet,
  positions: [],
  config: defaultConfig,
  killLog: [],
  liveFeed: [],
  pnl24hUsd: 0,
  pnl24hPercent: 0,

  setMode: (mode) => set({ mode }),

  setAgents: (agents) => set({ agents }),

  updateAgent: (name, update) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.name === name ? { ...a, ...update } : a)),
    })),

  setPositions: (positions) => set({ positions }),

  addPosition: (pos) => set((s) => ({ positions: [pos, ...s.positions] })),

  updatePosition: (id, update) =>
    set((s) => ({
      positions: s.positions.map((p) => (p.id === id ? { ...p, ...update } : p)),
    })),

  removePosition: (id) => set((s) => ({ positions: s.positions.filter((p) => p.id !== id) })),

  setConfig: (config) => set({ config }),

  setWallet: (wallet) => set((s) => ({ wallet: { ...s.wallet, ...wallet } })),

  addKillLog: (entry) => set((s) => ({ killLog: [entry, ...s.killLog].slice(0, 200) })),

  pushFeed: (entry) =>
    set((s) => ({
      liveFeed: [{ ts: Date.now(), ...entry }, ...s.liveFeed].slice(0, 500),
    })),

  setPnl: (pnl24hUsd, pnl24hPercent) => set({ pnl24hUsd, pnl24hPercent }),
}));
