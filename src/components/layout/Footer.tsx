export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-primary-800/95">
      <div className="max-w-6xl mx-auto px-8 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold italic text-white">UpForm</span>
        <span className="text-[10px] text-white">
          © {new Date().getFullYear()} BNCC. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
