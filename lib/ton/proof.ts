import { createHash } from "crypto";
import { signVerify } from "@ton/crypto";

export type TonAccount = {
  address: string;       // raw "workchain:hexhash"
  chain: string;         // "-239" = mainnet, "-3" = testnet
  publicKey: string;     // hex-encoded 32-byte Ed25519 public key
  walletStateInit: string; // base64 BOC
};

export type TonProofPayload = {
  timestamp: number;
  domain: { lengthBytes: number; value: string };
  signature: string;     // base64
  payload: string;       // the nonce we issued
};

export type ProofResult =
  | { ok: true; address: string; publicKey: string; network: "mainnet" | "testnet" }
  | { ok: false; reason: string };

export function verifyTonProof(
  account: TonAccount,
  proof: TonProofPayload,
  expectedPayload: string,
  expectedDomain: string
): ProofResult {
  // Payload must match what we issued
  if (proof.payload !== expectedPayload) {
    return { ok: false, reason: "payload_mismatch" };
  }

  // Timestamp must be within ±5 minutes of now
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - proof.timestamp) > 300) {
    return { ok: false, reason: "timestamp_expired" };
  }

  // Domain must match
  if (proof.domain.value !== expectedDomain) {
    return { ok: false, reason: "domain_mismatch" };
  }

  // Domain lengthBytes must match the actual byte length
  const domainBytes = Buffer.from(proof.domain.value, "utf8");
  if (proof.domain.lengthBytes !== domainBytes.length) {
    return { ok: false, reason: "domain_length_mismatch" };
  }

  // Parse raw address: "workchain:hexhash"
  const colonIdx = account.address.indexOf(":");
  if (colonIdx === -1) return { ok: false, reason: "invalid_address" };
  const wc = parseInt(account.address.slice(0, colonIdx), 10);
  const hashHex = account.address.slice(colonIdx + 1);
  if (hashHex.length !== 64) return { ok: false, reason: "invalid_address_hash" };

  // Workchain byte (int32 big-endian)
  const wcBuf = Buffer.alloc(4);
  wcBuf.writeInt32BE(wc, 0);

  // Address hash (32 bytes)
  const hashBuf = Buffer.from(hashHex, "hex");

  // domain.lengthBytes (uint32 little-endian)
  const domainLenBuf = Buffer.alloc(4);
  domainLenBuf.writeUInt32LE(proof.domain.lengthBytes, 0);

  // Timestamp (uint64 little-endian)
  const tsBuf = Buffer.alloc(8);
  tsBuf.writeBigUInt64LE(BigInt(proof.timestamp), 0);

  // Canonical message per TON Connect spec
  const message = Buffer.concat([
    Buffer.from("ton-proof-item-v2/"),
    wcBuf,
    hashBuf,
    domainLenBuf,
    domainBytes,
    tsBuf,
    Buffer.from(proof.payload, "utf8"),
  ]);

  // Final buffer: 0xFF || 0xFF || "ton-connect" || sha256(message)
  const bufferToVerify = Buffer.concat([
    Buffer.from([0xff, 0xff]),
    Buffer.from("ton-connect"),
    createHash("sha256").update(message).digest(),
  ]);

  // Ed25519 signature verification via @ton/crypto (uses tweetnacl under the hood)
  const publicKeyBuf = Buffer.from(account.publicKey, "hex");
  const signatureBuf = Buffer.from(proof.signature, "base64");

  let valid: boolean;
  try {
    valid = signVerify(bufferToVerify, signatureBuf, publicKeyBuf);
  } catch {
    return { ok: false, reason: "signature_error" };
  }

  if (!valid) return { ok: false, reason: "signature_invalid" };

  const network = account.chain === "-239" ? "mainnet" : "testnet";
  return { ok: true, address: account.address, publicKey: account.publicKey, network };
}
