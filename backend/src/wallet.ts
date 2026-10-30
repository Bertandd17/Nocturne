import { Keypair } from '@solana/web3.js';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const WALLET_FILE = './burner-wallet.enc';
const ENC_ALGO = 'aes-256-gcm';
const SECRET = process.env.WALLET_SECRET ?? 'dev-secret-change-in-prod';

let _cached: Keypair | null = null;

function keyFromSecret(secret: string): Buffer {
  return createHash('sha256').update(secret).digest(); // 32‑byte key
}

export function generateBurner(): Keypair {
  return Keypair.generate();
}

export function encryptWallet(kp: Keypair, secret = SECRET): string {
  const priv = Buffer.from(kp.secretKey);
  const key = keyFromSecret(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENC_ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(priv), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptWallet(encrypted: string, secret = SECRET): Keypair {
  const buf = Buffer.from(encrypted, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const key = keyFromSecret(secret);
  const decipher = createDecipheriv(ENC_ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return Keypair.fromSecretKey(dec);
}

export function loadOrCreateBurner(): Keypair {
  if (_cached) return _cached;
  try {
    const fs = require('fs') as typeof import('fs');
    if (fs.existsSync(WALLET_FILE)) {
      const enc = fs.readFileSync(WALLET_FILE, 'utf8');
      _cached = decryptWallet(enc);
    } else {
      _cached = generateBurner();
      fs.writeFileSync(WALLET_FILE, encryptWallet(_cached), 'utf8');
    }
  } catch {
    _cached = generateBurner();
  }
  return _cached;
}

export function burnerPubkey(): string {
  return loadOrCreateBurner().publicKey.toBase58();
}