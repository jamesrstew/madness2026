import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Algorithm Methodology",
  description:
    "Understand how Golden Bracket predicts March Madness — choose the technical deep-dive or the plain-English explainer.",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <header className="text-center mb-12 sm:mb-16">
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-ink mb-4">
          Algorithm Methodology
        </h1>
        <p className="text-lg sm:text-xl text-ink-muted max-w-2xl mx-auto leading-relaxed">
          Golden Bracket combines ten statistical factors, prediction market
          signals, and 10,000 simulated tournaments to forecast March Madness.
          Choose how deep you want to go.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
        {/* Explained Version */}
        <Link
          href="/methodology/explained"
          className="group block rounded-xl border border-rule bg-paper p-6 sm:p-8 hover:border-old-gold/50 hover:shadow-lg transition-all duration-200"
        >
          <div className="text-3xl mb-4">&#9889;</div>
          <h2 className="font-display text-xl sm:text-2xl tracking-tight text-ink mb-2 group-hover:text-old-gold transition-colors">
            How It Works
          </h2>
          <p className="text-ink-muted leading-relaxed mb-4">
            The full system explained in plain English. Assumes
            intelligence, not a statistics degree. Covers every component
            of the algorithm — what it does, why it's there, and how
            the pieces fit together.
          </p>
          <div className="flex items-center gap-4 text-sm text-ink-faint">
            <span>20 min read</span>
            <span className="text-rule">|</span>
            <span>No equations required</span>
          </div>
          <div className="mt-4 text-old-gold text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Start reading
            <span aria-hidden="true">&rarr;</span>
          </div>
        </Link>

        {/* Scientific Version */}
        <Link
          href="/methodology/scientific"
          className="group block rounded-xl border border-rule bg-paper p-6 sm:p-8 hover:border-old-gold/50 hover:shadow-lg transition-all duration-200"
        >
          <div className="text-3xl mb-4">&#128218;</div>
          <h2 className="font-display text-xl sm:text-2xl tracking-tight text-ink mb-2 group-hover:text-old-gold transition-colors">
            The Technical Paper
          </h2>
          <p className="text-ink-muted leading-relaxed mb-4">
            A comprehensive academic whitepaper with full mathematical
            formulations, proofs of key properties, derivations from
            Bradley-Terry and Log5 models, and complete parameter
            specifications. LaTeX notation throughout.
          </p>
          <div className="flex items-center gap-4 text-sm text-ink-faint">
            <span>35 min read</span>
            <span className="text-rule">|</span>
            <span>Full LaTeX notation</span>
          </div>
          <div className="mt-4 text-old-gold text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Start reading
            <span aria-hidden="true">&rarr;</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
