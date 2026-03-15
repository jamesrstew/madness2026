export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-dark px-6 py-8 text-center text-sm text-gray-500">
      <p className="mb-2">Powered by ESPN, CBBD, NCAA data</p>
      <p>&copy; {new Date().getFullYear()} Madness 2026. All rights reserved.</p>
    </footer>
  );
}
