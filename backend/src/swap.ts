import { Connection, VersionedTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { loadOrCreateBurner } from './wallet';

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const LAMPORTS_PER_SOL_CONST = LAMPORTS_PER_SOL;

const RPC = process.env.SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com';
const JUPITER_API = 'https://quote-api.jup.ag/v6';

export async function fetchQuote(inputMint: string, outputMint: string, amountLamports: number) {
  const url = `${JUPITER_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jupiter quote error: ${res.statusText}`);
  return res.json();
}

export async function executeRealSwap(inputMint: string, outputMint: string, amountLamports: number) {
  const quoteResponse = await fetchQuote(inputMint, outputMint, amountLamports);
  const burner = loadOrCreateBurner();

  const swapRes = await fetch(`${JUPITER_API}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: burner.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
    }),
  });

  if (!swapRes.ok) throw new Error(`Jupiter swap error: ${swapRes.statusText}`);
  const { swapTransaction } = (await swapRes.json()) as any;

  const txBuf = Buffer.from(swapTransaction, 'base64');
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([burner]);

  const conn = new Connection(RPC, 'confirmed');
  const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  await conn.confirmTransaction(sig, 'confirmed');
  return sig;
}
