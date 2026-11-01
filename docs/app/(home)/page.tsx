import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-20 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
        Enterprise Blockchain Voting Platform
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-fd-foreground">
        Voting Platform Documentation
      </h1>
      <p className="max-w-2xl text-base sm:text-lg text-fd-muted-foreground mb-8">
        Provably tamper-proof, transparent corporate elections backed by smart contracts,
        zero-gas voter participation, and cryptographic ballot verification.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/docs"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-fd-primary text-fd-primary-foreground font-semibold shadow hover:opacity-90 transition-opacity"
        >
          Explore Documentation →
        </Link>
        <Link
          href="/docs/api/elections"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-fd-border font-medium text-fd-foreground hover:bg-fd-muted transition-colors"
        >
          API Reference
        </Link>
      </div>
    </div>
  );
}
