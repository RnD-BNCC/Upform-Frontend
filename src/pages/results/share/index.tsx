import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChartPieSliceIcon,
  ClockIcon,
  DatabaseIcon,
  FileTextIcon,
  LockKeyIcon,
  SignInIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { useQuerySharedResults } from "@/api/results-share";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/hooks";
import { BrandLogo } from "@/components/layout";
import { authClient } from "@/lib";
import DatabaseView from "@/components/responses/database/DatabaseView";
import SummaryTab from "@/components/responses/SummaryTab";
import type { FormField, FormResponseProgress } from "@/types/form";

type SharedResultTab = "database" | "submissions" | "inProgress" | "summary";

const RESULT_TABS: Array<{
  icon: typeof DatabaseIcon;
  key: SharedResultTab;
  label: string;
}> = [
  { key: "database", label: "Database", icon: DatabaseIcon },
  { key: "submissions", label: "Submissions", icon: FileTextIcon },
  { key: "inProgress", label: "In progress", icon: ClockIcon },
  { key: "summary", label: "Summary", icon: ChartPieSliceIcon },
];

function getAllFields(sections: Array<{ fields?: FormField[] }>) {
  return sections.flatMap((section) => section.fields ?? []);
}

export default function SharedResultsPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<SharedResultTab>("database");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { data: session, isPending: isSessionPending } = useAuth();
  const sharedQuery = useQuerySharedResults(token, !!session, !isSessionPending);
  const event = sharedQuery.data?.event;
  const role = sharedQuery.data?.role ?? "viewer";
  const user = session?.user;
  const fields = useMemo(() => getAllFields(event?.sections ?? []), [event?.sections]);
  const responses = event?.responses ?? [];
  const progressResponses = (event?.responseProgresses ?? []) as FormResponseProgress[];
  const canEdit = role === "editor" && Boolean(session);
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  const loginPath = `/login?redirect=${encodeURIComponent(
    `${location.pathname}${location.search}`,
  )}`;
  const isAccessDenied =
    sharedQuery.isError &&
    ((sharedQuery.error as { response?: { status?: number } }).response
      ?.status === 401 ||
      (sharedQuery.error as { response?: { status?: number } }).response
        ?.status === 403);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await authClient.signOut();
    window.location.reload();
  };

  const renderContent = () => {
    if (!event) return null;

    if (activeTab === "summary") {
      return (
        <div className="h-full overflow-y-auto bg-gray-50 p-6">
          <SummaryTab responses={responses} allFields={fields} />
        </div>
      );
    }

    if (activeTab === "submissions") {
      return (
        <DatabaseView
          allFields={fields}
          eventId={event.id}
          mode="submissions"
          progressResponses={[]}
          readOnly={!canEdit}
          responses={responses}
          sections={event.sections}
          title="Submissions"
        />
      );
    }

    if (activeTab === "inProgress") {
      return (
        <DatabaseView
          allFields={fields}
          eventId={event.id}
          mode="inProgress"
          progressResponses={progressResponses}
          readOnly={!canEdit}
          responses={[]}
          sections={event.sections}
          title="In progress"
        />
      );
    }

    return (
      <DatabaseView
        allFields={fields}
        eventId={event.id}
        mode="database"
        progressResponses={progressResponses}
        readOnly={!canEdit}
        responses={responses}
        sections={event.sections}
        title="My form database"
      />
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="shrink-0 bg-primary-800">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-8">
          <BrandLogo variant="white" className="h-7 w-auto max-w-[120px]" />
          {session ? (
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="h-8 w-8 overflow-hidden rounded-full border-2 border-white/25 transition-colors hover:border-white/50"
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name ?? "Avatar"}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/15 text-[10px] font-bold text-white">
                    {initials}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {profileOpen ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.08, ease: "easeOut" }}
                    className="absolute right-0 top-10 z-50 w-44 select-none overflow-hidden rounded-sm border border-gray-100/80 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)]"
                  >
                    <div className="px-2.5 pb-2 pt-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100">
                          {user?.image ? (
                            <img
                              src={user.image}
                              alt={user.name ?? "Avatar"}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[8px] font-bold text-primary-600">
                              {initials}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold text-gray-800">
                            {user?.name ?? "My Account"}
                          </p>
                          <p className="truncate text-[9px] text-gray-400">
                            {user?.email ?? ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] font-semibold text-red-500 transition-colors hover:bg-red-50 hover:font-bold hover:text-red-700 active:bg-red-100"
                      >
                        <SignOutIcon
                          size={12}
                          className="shrink-0 transition-transform group-hover:scale-110 group-active:scale-95"
                        />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate(loginPath)}
              className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-primary-800"
            >
              <SignInIcon size={14} weight="bold" />
              Sign in
            </button>
          )}
        </div>
      </header>

      {sharedQuery.isLoading || isSessionPending ? (
        <main className="flex flex-1 items-center justify-center gap-3 text-gray-400">
          <Spinner size={28} className="text-primary-500" />
          Loading shared results...
        </main>
      ) : isAccessDenied ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <LockKeyIcon size={42} className="text-gray-300" />
          <div>
            <h1 className="text-base font-bold text-gray-800">Access required</h1>
            <p className="mt-1 max-w-sm text-sm text-gray-400">
              These results are restricted to invited emails.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(loginPath)}
            className="rounded-md bg-primary-500 px-4 py-2 text-sm font-bold text-white"
          >
            Sign in
          </button>
        </main>
      ) : sharedQuery.isError || !event ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center text-gray-400">
          <DatabaseIcon size={42} weight="thin" />
          <p className="text-sm font-semibold">
          Shared results are not available.
          </p>
        </main>
      ) : (
        <main className="flex min-h-0 flex-1 bg-white">
        <div className="flex min-h-0 min-w-0 flex-1">
          <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-50 px-2 py-2">
            <div className="mb-3 rounded-md bg-white px-3 py-3 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-600">
                Shared Results
              </p>
              <h1 className="mt-1 truncate text-sm font-black text-gray-950">
                {event.name}
              </h1>
              <p className="mt-1 text-[11px] font-semibold capitalize text-gray-400">
                {role} access
              </p>
            </div>

            <nav className="space-y-1">
              {RESULT_TABS.map(({ icon: Icon, key, label }) => {
                const isActive = activeTab === key;
                const count =
                  key === "submissions"
                    ? responses.length
                    : key === "inProgress"
                      ? progressResponses.length
                      : null;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-white text-gray-950 shadow-sm"
                        : "text-gray-700 hover:bg-white hover:text-gray-950"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                        isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <Icon size={13} weight="fill" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-left">
                      {label}
                    </span>
                    {count !== null ? (
                      <span className="rounded-full bg-gray-200 px-1.5 text-xs font-semibold text-gray-700">
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 overflow-hidden">{renderContent()}</div>
        </div>
        </main>
      )}
    </div>
  );
}
