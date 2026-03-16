export default function Footer() {
  return (
    <footer className="border-t border-rule bg-surface px-4 sm:px-6 py-6 sm:py-8 text-center text-sm text-ink-muted">
      <p className="mb-2">Powered by ESPN, CBBD, NCAA data</p>
      <p>&copy; {new Date().getFullYear()} Golden Bracket. All rights reserved.</p>
    </footer>
  );
}
