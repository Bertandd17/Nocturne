# Nocturne – Solana Memecoin Night Desk

An autonomous, 24/7 Solana memecoin automated trading pipeline with a 6-agent hard-handoff architecture and an accompanying React Native (Expo) telemetry mobile app.

---

## 🏛️ System Architecture

```
                    ┌────────────────────────────┐
                    │      React Native Expo     │
                    │   (Telemetry & Control)    │
                    └──────────────┬─────────────┘
                                   │ WebSocket / REST
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Nocturne Backend Engine                         │
│                                                                        │
│  [1. Scout] ──► [2. Filter] ──► [3. Analyst] ──► [4. Executor]        │
│      │               │                │                 │              │
│      ▼               ▼                ▼                 ▼              │
│  Pair Monitor   RugCheck/Safety   Scoring Heuristic  Position Entry    │
│  (Pump/Raydium)                                                        │
│                                                          │             │
│                                                          ▼             │
│                     [6. Logger] ◄─────────────── [5. Risk]             │
│                     Audit/Kill Log              SL -8% / Trailing +15% │
└────────────────────────────────────────────────────────────────────────┘
```

- **Backend:** Node.js, Fastify, TypeScript, Native WebSocket, Solana Web3.
- **Mobile:** Expo (React Native), Zustand, Expo Router, dark-shell glass theme adapted from `DESIGN.md`.
- **Shared:** Common TypeScript contracts and design tokens across backend and mobile.

---

## 🤖 6-Agent Pipeline (Hard Handoff)

1. **Scout Agent:** Monitors real-time pair creation across PumpFun, BonkFun, Raydium, and Meteora.
2. **Filter Agent:** Enforces non-negotiable safety criteria:
   - Mint authority must be revoked.
   - LP must be permanently burned or locked.
   - Top 10 holders control ≤ 25% of the supply.
   - 1-hour volume must meet threshold (default ≥ $40k).
   - Dev wallet has no prior rugpull associations.
   - Rejects artificial bundled launches.
3. **Analyst Agent:** Computes a deterministic heuristic score ($0.0$ to $1.0$). Rejects any token scoring below $0.6$.
4. **Executor Agent:** Opens positions sizing at max 10% of portfolio balance per trade.
5. **Risk Agent:** Enforces an immediate -8% hard stop loss upon entry, and engages trailing stops once the position hits +15% profit (5% trailing delta).
6. **Logger Agent:** Records all rejections, kills, and execution traces into the audit log.

---

## 🌓 Operational Modes

### 1. Demo Mode (Paper Trading)
- Virtual 10 SOL balance (resetable via dashboard).
- Simulates market price action and slippage.
- No wallet or real funds needed.

### 2. Real Account Mode
- **Phantom Connection:** Connects via Phantom Deeplink / Solana Mobile Wallet Adapter.
- **Zero Key Custody:** The user's personal private keys never touch the backend.
- **Burner Architecture:** Backend generates a dedicated hot execution wallet with AES-256-GCM encrypted local storage.
- **User-Approved Funding:** User funds the burner wallet manually from Phantom up to a user-defined max deposit limit.
- **7-Day Demo Lockout:** Real mode cannot be activated until the system has logged at least 7 days in Demo mode.
- **Kill Switch & Daily Loss Limit:** Safety cutoff halts all bot operations immediately.

---

## 🎨 Design System (Adapted from DESIGN.md)

- **Color Palette:**
  - Background: `#FCFAF7` (warm paper workspace)
  - Dark Glass Shell: `rgba(0, 0, 0, 0.70)`
  - Primary / Telemetry Accent: `#FE6E00` (Signal Orange)
  - Semantic: `#00C758` (Active), `#FB2C36` (Danger/Killed), `#EDB200` (Warning)
- **App Icon:** Configured to custom Nocturne visual (`mobile/assets/logo.jpeg`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 9

### 1. Installation
```bash
git clone <repo-url>
cd Nocturne
pnpm install
```

### 2. Run Backend
```bash
cp backend/.env.example backend/.env
pnpm backend:dev
```
Backend will start on `http://localhost:3000` with WebSocket on `ws://localhost:3000/ws`.

### 3. Run Mobile App
```bash
# In another terminal
pnpm mobile:dev
```
- Scan QR code using Expo Go on Android or iOS.
- Or press `a` for Android Emulator / `w` for Web.
- The mobile app will auto-detect backend via debugger host or fallback to `http://localhost:3000`.

### 4. Run Unit Tests
```bash
pnpm backend:test
```
5 unit tests run against Filter, Analyst, Risk stop loss / trailing stop, and AES-256-GCM burner wallet encryption.

---

## 📡 REST & WebSocket API Specification

- `GET /health`: Engine status check.
- `GET /state`: Complete state payload (agents, positions, balances, thresholds).
- `POST /config`: Update dynamic thresholds.
- `POST /demo/reset`: Reset demo virtual balance to specified SOL amount.
- `POST /positions/:id/close`: Manually trigger market-exit on an open position.
- `POST /kill-switch`: Activate or deactivate emergency kill switch.
- `POST /mode`: Switch between `demo` and `real` (gated by 7-day rule).
- `GET /real/burner`: Retrieve public address of backend execution burner.
- `POST /real/withdraw`: Withdraw remaining SOL from burner back to user Phantom wallet.
- `WS /ws`: Real-time streaming for live feed, telemetry, and position updates.

---

## 🌐 Deploy to VPS

1. Clone on VPS:
```bash
git clone <repo-url>
cd Nocturne
pnpm install
```
2. Set environment:
```bash
cp backend/.env.example backend/.env
# Update SOLANA_RPC, WALLET_SECRET, etc.
```
3. Run backend with PM2:
```bash
pnpm --filter @nocturne/backend build
pm2 start backend/dist/index.js --name nocturne-backend
```
4. Configure Mobile to point to your VPS IP / domain via `EXPO_PUBLIC_BACKEND_URL`:
```bash
EXPO_PUBLIC_BACKEND_URL=ws://<your-vps-ip>:3000/ws pnpm mobile:dev
```

