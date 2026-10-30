import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { config } from 'dotenv';
import { burnerPubkey, loadOrCreateBurner } from './wallet';
import { executeRealSwap } from './swap';
import { PipelineManager } from './pipeline';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

config();

const app = Fastify({ logger: true });
// registration moved into start()
// Track all connected WebSockets
const clients = new Set<any>();

function broadcast(msg: any) {
  const payload = JSON.stringify(msg);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

const pipeline = new PipelineManager(broadcast);
// pipeline.start() called after server is listening

// Health check
app.get('/health', async () => ({ status: 'ok' }));

// Full state snapshot
app.get('/state', async () => {
  return pipeline.getState();
});

// Update thresholds
app.post('/config', async (req, reply) => {
  const body = req.body as any;
  pipeline.setConfig(body);
  return { status: 'ok', config: pipeline.getState().config };
});

// Reset demo balance
app.post('/demo/reset', async (req) => {
  const body = req.body as any;
  const sol = body?.sol || 10;
  pipeline.resetDemoBalance(sol);
  return { status: 'ok', balanceSol: sol };
});

// Close a position manually
app.post('/positions/:id/close', async (req) => {
  const { id } = req.params as { id: string };
  await pipeline.manualClose(id);
  return { status: 'ok', positionId: id };
});

// Kill switch toggle
app.post('/kill-switch', async (req) => {
  const body = req.body as any;
  const active = Boolean(body?.active);
  pipeline.setConfig({ killSwitchActive: active });
  return { status: 'ok', killSwitchActive: active };
});

// Real Mode: Get Burner Wallet Public Key
app.get('/real/burner', async () => {
  return { address: burnerPubkey() };
});

// Real Mode: Withdraw back to Phantom User
app.post('/real/withdraw', async (req, reply) => {
  const body = req.body as any;
  const { toAddress, amountSol } = body;
  if (!toAddress || !amountSol) {
    return reply.status(400).send({ error: 'Missing toAddress or amountSol' });
  }

  const burner = loadOrCreateBurner();
  const conn = new Connection(process.env.SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com', 'confirmed');
  
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: burner.publicKey,
      toPubkey: new PublicKey(toAddress),
      lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
    })
  );

  const sig = await conn.sendTransaction(tx, [burner]);
  await conn.confirmTransaction(sig, 'confirmed');
  return { status: 'ok', signature: sig };
});

// Switch mode with 7-day demo requirement check
app.post('/mode', async (req, reply) => {
  const body = req.body as any;
  const requestedMode = body?.mode;
  const demoDaysActive = body?.demoDaysActive ?? 0;

  if (requestedMode === 'real' && demoDaysActive < 7) {
    return reply.status(403).send({
      error: 'Real mode is locked. You must run demo mode for at least 7 days before going live.',
    });
  }

  pipeline.setMode(requestedMode);
  return { status: 'ok', mode: requestedMode };
});

// WebSocket endpoint for real-time streaming to mobile
app.get('/ws', { websocket: true }, (connection, req) => {
  clients.add(connection);

  // Send initial state on connection
  connection.send(JSON.stringify({ type: 'init', state: pipeline.getState() }));

  connection.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'ping') {
        connection.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (e) {
      // ignore
    }
  });

  connection.on('close', () => {
    clients.delete(connection);
  });
});

const start = async () => {
  try {
    await app.register(fastifyCors, { origin: true });
    await app.register(fastifyWebsocket);
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Backend running on port ${port}`);
    pipeline.start(10000);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
