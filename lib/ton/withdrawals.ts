import { Address } from "@ton/ton";

export type TonAddressNormalized = {
  raw: string;      // "0:hexhash" — 66 chars
  friendly: string; // "EQxxx…" bounceable URL-safe — for Tonkeeper / admin display
};

/** Parse and normalise any TON address form. Returns null for invalid input. */
export function parseTonAddress(input: string): TonAddressNormalized | null {
  try {
    const trimmed = input.trim();
    let addr: Address;
    if (trimmed.startsWith("0:") || trimmed.startsWith("-1:")) {
      addr = Address.parseRaw(trimmed);
    } else {
      addr = Address.parseFriendly(trimmed).address;
    }
    return {
      raw: `0:${addr.hash.toString("hex")}`,
      friendly: addr.toString({ urlSafe: true, bounceable: true }),
    };
  } catch {
    return null;
  }
}
