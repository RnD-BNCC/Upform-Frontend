import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar, Footer } from "@/components/layout";
import { EventCard, ContextMenu } from "@/components/events";
import { NoFormsIllustration } from "@/components/ui";
import { mockEvents } from "@/mock/events";
import type { FormEvent } from "@/types/form";
import { MagnifyingGlass } from "@phosphor-icons/react";

type Filter = "All" | "Active" | "Draft" | "Closed";
const FILTERS: Filter[] = ["All", "Active", "Draft", "Closed"];

export default function HomePage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  const [events, setEvents] = useState<FormEvent[]>(mockEvents);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [ctxMenu, setCtxMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  const activeCount = events.filter((e) => e.status === "active").length;
  const totalResponses = events.reduce((sum, e) => sum + e.responseCount, 0);

  const filtered = events.filter((e) => {
    const matchFilter =
      filter === "All" ||
      e.status === (filter.toLowerCase() as FormEvent["status"]);
    const matchSearch =
      !search || e.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setCtxMenu(null);
  };

  const handleToggleStatus = (id: string) => {
    const next: Record<string, FormEvent["status"]> = {
      active: "draft",
      draft: "active",
      closed: "active",
    };
    setEvents((prev) =>
      prev.map((e) =>
        e.id !== id ? e : { ...e, status: next[e.status] ?? e.status },
      ),
    );
    setCtxMenu(null);
  };

  const ctxEvent = ctxMenu
    ? (events.find((e) => e.id === ctxMenu.id) ?? null)
    : null;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-text", {
        opacity: 0,
        y: 20,
        duration: 0.55,
        ease: "power3.out",
      });
      gsap.from(".stat-card", {
        opacity: 0,
        x: 20,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.2,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,84,165,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,84,165,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      {/* Navbar + Hero unified block */}
      <div className="bg-primary-800 rounded-b-4xl shadow-[0_12px_40px_-8px_rgba(0,30,70,0.45)] relative">
        <div className="absolute inset-0 overflow-hidden rounded-b-4xl pointer-events-none">
          <div
            className="absolute inset-0 "
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 18% 80%, rgba(0,30,70,0.45)] 0%, transparent 55%), radial-gradient(ellipse at 85% 10%, rgba(0,18,42,0.65) 0%, transparent 50%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 0% 100%, rgba(255,255,255,0.18) 0%, transparent 50%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
              backgroundSize: "10px 10px",
            }}
          />
        </div>

        <Navbar />

        {/* Hero */}
        <div ref={heroRef} className="relative">
          <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-10">
            {/* Text */}
            <div className="hero-text">
              <p className="text-primary-300 text-sm font-bold mb-1">
                Welcome back
              </p>
              <h1 className="text-[1.75rem] sm:text-[2rem] font-bold text-white leading-tight">
                My Forms
              </h1>
              <p className="text-white text-sm mt-1.5">
                Build, share, and analyze forms with ease.
              </p>
            </div>

            {/* Stat bar */}
            <div className="stat-card flex items-stretch bg-white/10 border border-white/15 rounded-xl backdrop-blur-sm divide-x divide-white/10 w-full sm:w-auto shrink-0">
              {[
                { value: events.length, label: "Total Forms" },
                { value: activeCount, label: "Active" },
                { value: totalResponses, label: "Responses" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center flex-1 sm:flex-none sm:px-8 py-4 sm:py-5 gap-1 sm:gap-1.5"
                >
                  <span className="text-2xl sm:text-[2.25rem] font-black text-white leading-none tracking-tight">
                    {value}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-white/50 font-semibold tracking-widest uppercase">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-gray-900">All Forms</h2>
              <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-semibold">
                {filtered.length}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage and track your forms
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <MagnifyingGlass
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search forms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-52 pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white transition-all placeholder-gray-400 shadow-sm"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 sm:px-3.5 py-1.5 rounded-md font-medium transition-all ${
                    filter === f
                      ? "bg-primary-500 text-white shadow-sm"
                      : "text-gray-500 bg-white border border-gray-200 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid or empty */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex flex-col items-center justify-center gap-4 py-16 sm:py-24"
            >
              <NoFormsIllustration />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">
                  No forms found
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {search
                    ? `No results for "${search}". Try a different keyword.`
                    : "Try a different filter, or create a new form."}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
            >
              {filtered.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={i}
                  onContextMenu={(id, x, y) => setCtxMenu({ id, x, y })}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />

      {/* Context menu */}
      <AnimatePresence>
        {ctxMenu && ctxEvent && (
          <ContextMenu
            key={ctxMenu.id}
            x={ctxMenu.x}
            y={ctxMenu.y}
            event={ctxEvent}
            onClose={() => setCtxMenu(null)}
            onOpen={() => {
              navigate(`/events/${ctxEvent.id}`);
              setCtxMenu(null);
            }}
            onDelete={() => handleDelete(ctxEvent.id)}
            onToggleStatus={() => handleToggleStatus(ctxEvent.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
