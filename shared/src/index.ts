// Nocturne Shared Types

export type AgentStatus = 'idle' | 'running' | 'error' | 'disabled';

export interface AgentInfo {
  name: 'scout' | 'filter' | 'analyst' | 'executor' | 'risk' | 'logger';
  status: AgentStatus;
  lastActive: number;
  message?: string;
  processedCount: number;
}

export type TradingMode = 'demo' | 'real';

export interface ThresholdConfig {
  maxBalancePerTradePercent: number; // e.g. 10
  stopLossPercent: number; // e.g. -8
  trailingStopTriggerPercent: number; // e.g. 15
  trailingStopDeltaPercent: number; // e.g. 5
  analystMinScore: number; // e.g. 0.6
  filterMinVolume1hUsd: number; // e.g. 40000
  filterMaxTop10HolderPercent: number; // e.g. 25
  filterRequireMintRevoked: boolean;
  filterRequireLpLocked: boolean;
  filterRejectDevPreviousRug: boolean;
  filterRejectBundledLaunch: boolean;
  maxDailyLossUsd: number;
  maxDepositSol: number;
  killSwitchActive: boolean;
}

export interface TokenCandidate {
  address: string;
  name: string;
  symbol: string;
  source: 'PumpFun' | 'BonkFun' | 'Raydium' | 'Meteora';
  createdAt: number;
  initialPriceUsd: number;
  initialSolLiquidity: number;
  volume1hUsd?: number;
  devWallet?: string;
}

export interface SecurityCheckResult {
  mintAuthorityRevoked: boolean;
  lpLocked: boolean;
  top10HolderPercent: number;
  volume1hUsd: number;
  devHasPreviousRug: boolean;
  isBundledLaunch: boolean;
  passed: boolean;
  rejectionReason?: string;
}

export interface AnalystEvaluation {
  tokenAddress: string;
  score: number; // 0 to 1
  breakdown: {
    liquidityScore: number;
    volumeScore: number;
    holderDistributionScore: number;
    socialSentimentScore: number;
  };
  passed: boolean;
}

export interface Position {
  id: string;
  tokenAddress: string;
  symbol: string;
  mode: TradingMode;
  entryPriceUsd: number;
  currentPriceUsd: number;
  amountToken: number;
  investedSol: number;
  entryTimestamp: number;
  stopLossPriceUsd: number;
  highestPriceUsd: number;
  trailingActive: boolean;
  trailingStopPriceUsd?: number;
  pnlUsd: number;
  pnlPercent: number;
  txSignature?: string;
  status: 'open' | 'closed';
  closedReason?: 'stop_loss' | 'trailing_stop' | 'take_profit' | 'manual' | 'kill_switch';
  closedTimestamp?: number;
}

export interface KillLogEntry {
  id: string;
  timestamp: number;
  tokenAddress: string;
  symbol: string;
  source: string;
  ruleViolated: string;
  details: string;
}

export interface WalletState {
  mode: TradingMode;
  connected: boolean;
  userAddress: string | null;
  balanceSol: number;
  tradingWalletAddress: string | null;
  tradingWalletBalanceSol: number;
  demoDaysActive: number;
  realUnlocked: boolean;
}

export interface AppStatePayload {
  mode: TradingMode;
  agents: AgentInfo[];
  wallet: WalletState;
  positions: Position[];
  config: ThresholdConfig;
  pnl24hUsd: number;
  pnl24hPercent: number;
}

// Design Tokens from DESIGN.md (Evreghen Command Center)
export const DESIGN_TOKENS = {
  colors: {
    background: '#FCFAF7',
    onBackground: '#423D38',
    surface: '#F3F4F6',
    surfaceSoft: '#EDEBE9',
    surfaceElevated: '#FFFFFF',
    onSurface: '#423D38',
    onSurfaceMuted: '#797067',
    outline: '#E3E0DD',
    outlineStrong: '#D1D5DC',
    primary: '#FE6E00',
    primaryStrong: '#FF6B00',
    primaryWarm: '#FFB74D',
    primaryFocus: '#F97015',
    onPrimary: '#FFFFFF',
    shellBase: '#000000',
    onShell: '#FFFFFF',
    shellBorder: '#FFFFFF',
    success: '#00C758',
    warning: '#EDB200',
    danger: '#FB2C36',
    info: '#3080FF',
    statusMockBg: '#FEF9C2',
    statusMockFg: '#874B00',
    statusProductionBg: '#DCFCE7',
    statusProductionFg: '#016630',
  },
  typography: {
    displayHero: { fontSize: 48, fontWeight: '600' },
    headlineXl: { fontSize: 32, fontWeight: '700' },
    headlineLg: { fontSize: 24, fontWeight: '700' },
    titleMd: { fontSize: 18, fontWeight: '700' },
    bodyLg: { fontSize: 16, fontWeight: '400' },
    bodyMd: { fontSize: 14, fontWeight: '400' },
    bodySm: { fontSize: 13, fontWeight: '700' },
    labelMd: { fontSize: 14, fontWeight: '500' },
    labelSm: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  },
  rounded: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    pill: 9999,
  },
} as const;
