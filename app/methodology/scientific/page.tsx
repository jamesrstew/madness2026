import type { Metadata } from "next";
import { readFile } from "fs/promises";
import { join } from "path";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { articleComponents } from "@/mdx-components";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Technical Paper — Algorithm Methodology",
  description:
    "A comprehensive academic whitepaper describing the Golden Bracket prediction algorithm with full mathematical formulations, derivations, and parameter specifications.",
};

export default async function ScientificPage() {
  const source = await readFile(
    join(process.cwd(), "WHITEPAPER.mdx"),
    "utf-8",
  );

  return (
    <article className="methodology mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <nav className="mb-8 text-sm">
        <Link
          href="/methodology"
          className="text-ink-muted hover:text-old-gold transition-colors inline-flex items-center gap-1"
        >
          <span aria-hidden="true">&larr;</span>
          Back to methodology
        </Link>
      </nav>
      <MDXRemote
        source={source}
        components={articleComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm, remarkMath],
            rehypePlugins: [rehypeKatex],
          },
        }}
      />
    </article>
  );
}
