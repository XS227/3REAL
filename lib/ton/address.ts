import { Address } from "@ton/ton";

/** Convert any TON address form to lowercase raw hash (64 hex chars). */
export function toRawHash(addr: string): string {
  try {
    if (addr.startsWith("0:") || addr.startsWith("-1:")) {
      return addr.split(":")[1].toLowerCase();
    }
    return Address.parseFriendly(addr).address.hash.toString("hex").toLowerCase();
  } catch {
    return addr.toLowerCase();
  }
}
