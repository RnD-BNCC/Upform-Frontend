import { Link } from "react-router-dom";
import {
  ArrowRight,
  Files,
  GoogleDriveLogo,
  ImageSquare,
} from "@phosphor-icons/react";
import { BrandLogo, Footer } from "@/components/layout";

const FEATURES = [
  {
    title: "Create and share forms",
    description:
      "Build forms, publish them, and collect responses from participants.",
    icon: Files,
  },
  {
    title: "Manage submitted files",
    description:
      "Organize uploaded response files in event galleries and shared folders.",
    icon: ImageSquare,
  },
  {
    title: "Sync with Google Drive",
    description:
      "Optionally connect Google Drive to create gallery folders and sync selected files.",
    icon: GoogleDriveLogo,
  },
];

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <BrandLogo className="h-8 w-auto max-w-[140px]" />
          <div className="flex items-center gap-4 text-xs font-bold">
            <Link to="/privacy-policy" className="text-gray-500 hover:text-primary-600">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-gray-500 hover:text-primary-600">
              Terms
            </Link>
            <Link
              to="/login"
              className="rounded-md bg-primary-500 px-3 py-2 text-white hover:bg-primary-600"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8">
        <section className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-500">
            UpForm
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-gray-950 sm:text-5xl">
            Forms, responses, galleries, and Drive sync in one workspace.
          </h1>
          <p className="mt-5 text-base leading-7 text-gray-500">
            UpForm helps teams create forms, collect submissions, review
            response data, manage uploaded gallery files, and optionally sync
            selected gallery folders to Google Drive.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-600"
            >
              Sign in with Google
              <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              to="/privacy-policy"
              className="inline-flex items-center rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 hover:border-primary-300 hover:text-primary-600"
            >
              Read privacy policy
            </Link>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ description, icon: Icon, title }) => (
            <div key={title} className="rounded-md border border-gray-200 bg-white p-5">
              <div className="flex size-10 items-center justify-center rounded-md bg-primary-50 text-primary-500">
                <Icon size={22} weight="fill" />
              </div>
              <h2 className="mt-4 text-sm font-black text-gray-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
