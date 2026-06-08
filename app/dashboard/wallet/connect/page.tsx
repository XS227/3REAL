import { requireAuth } from "@/lib/auth/guards";
import { getTonWallets } from "@/lib/ton/queries";
import { ConnectWalletSection } from "@/components/ton/ConnectWalletSection";
import { ConnectedWallets } from "@/components/ton/ConnectedWallets";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConnectWalletPage() {
  const session = await requireAuth();
  const wallets = await getTonWallets(session.userId);

  return (
    <div className="space-y-8 max-w-xl">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/wallet"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wallet
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-100">TON Wallet</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Connect your TON wallet to enable future on-chain features.
          Only your address is stored — your keys never leave your device.
        </p>
      </div>

      {/* Linked wallets */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
          Linked Wallets ({wallets.length})
        </h2>
        <ConnectedWallets wallets={wallets} />
      </section>

      {/* Connect flow */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
          Connect New Wallet
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-300">Supported wallets</p>
            <p className="text-xs text-zinc-600">
              Tonkeeper · MyTonWallet · OpenMask · Tonhub · and all TON Connect 2.0 wallets
            </p>
          </div>
          <ConnectWalletSection />
        </div>
      </section>

      {/* Security note */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h3 className="text-xs font-semibold text-zinc-400 mb-2">How it works</h3>
        <ol className="space-y-1 text-xs text-zinc-600 list-decimal list-inside">
          <li>3REAL generates a one-time nonce</li>
          <li>Your wallet signs it with your private key (stays on your device)</li>
          <li>3REAL verifies the Ed25519 signature server-side</li>
          <li>Your address is saved only after successful verification</li>
        </ol>
      </section>
    </div>
  );
}
