import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { BrandLogo, Footer } from "@/components/layout";

type LegalPageShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
};

export default function LegalPageShell({
  children,
  eyebrow,
  title,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="inline-flex items-center">
            <BrandLogo className="h-8 w-auto max-w-[140px]" />
          </Link>
          <Link
            to="/"
            className="text-xs font-bold text-primary-600 hover:text-primary-700"
          >
            Back to UpForm
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary-500">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-black text-gray-950">{title}</h1>
        <p className="mt-2 text-sm text-gray-400">Last updated: May 7, 2026</p>

        <div className="mt-8 space-y-7 rounded-md border border-gray-200 bg-white p-5 text-sm leading-7 text-gray-600 shadow-sm sm:p-7">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
