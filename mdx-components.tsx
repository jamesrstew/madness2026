import type { MDXComponents } from "mdx/types";

/**
 * Styled MDX component overrides matching the Golden Bracket editorial design.
 * Used by the /methodology page to render the whitepaper.
 */
export const articleComponents: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight text-ink mb-3 mt-16 first:mt-0 leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-2xl sm:text-3xl tracking-tight text-ink mt-14 mb-4 pb-2 border-b border-rule scroll-mt-20">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display text-xl sm:text-2xl tracking-tight text-ink mt-10 mb-3 scroll-mt-20">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-display text-lg sm:text-xl tracking-tight text-ink mt-8 mb-2 scroll-mt-20">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-ink leading-relaxed mb-5 text-base sm:text-lg">
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-old-gold hover:text-old-gold-light underline underline-offset-2 transition-colors"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-ink">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-old-gold pl-5 my-6 text-ink-muted italic">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-6 mb-5 space-y-1.5 text-base sm:text-lg leading-relaxed">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-6 mb-5 space-y-1.5 text-base sm:text-lg leading-relaxed">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-ink">{children}</li>,
  hr: () => <hr className="editorial-rule my-12" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-6 -mx-4 sm:mx-0">
      <table className="min-w-full text-sm sm:text-base border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b-2 border-rule bg-surface">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-rule/50">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-surface/50 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2.5 text-left font-semibold text-ink text-sm tracking-wide">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2.5 text-ink-muted align-top">{children}</td>
  ),
  pre: ({ children }) => (
    <pre className="bg-surface rounded-lg p-4 sm:p-5 overflow-x-auto my-6 text-sm leading-relaxed border border-rule/50">
      {children}
    </pre>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className={`font-mono text-sm ${className ?? ""}`}>
          {children}
        </code>
      );
    }
    return (
      <code className="font-mono text-sm bg-surface px-1.5 py-0.5 rounded text-old-gold">
        {children}
      </code>
    );
  },
};

/**
 * Required by Next.js MDX support (used when .mdx files are pages).
 * Also re-exports articleComponents for use with next-mdx-remote.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...articleComponents, ...components };
}
