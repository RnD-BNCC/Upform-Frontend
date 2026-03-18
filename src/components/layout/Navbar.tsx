import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, List, X, SignOut } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { authClient } from "@/lib/auth-client";
import { useMutationCreateEvent } from "@/api/events";

const NAV_ITEMS = [
  { label: "My Forms", path: "/" },
  { label: "Templates", path: "/templates" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: session } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const createEvent = useMutationCreateEvent();
  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
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
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-20 bg-primary-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-8">
          <button
            onClick={() => navigate("/")}
            className="text-lg font-bold italic text-white shrink-0"
          >
            UpForm
          </button>
          <nav className="hidden sm:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ label, path }) => {
              const active = pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    active
                      ? "text-white bg-white/15 font-medium"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={async () => {
              const event = await createEvent.mutateAsync({ name: 'Untitled Form' });
              navigate(`/forms/${event.id}/edit`);
            }}
            className="flex items-center gap-1.5 bg-white text-primary-900 px-3 sm:px-3.5 py-1.5 text-xs font-bold tracking-widest uppercase border-2 border-primary-900 shadow-[2px_2px_0px_0px_#001d3a] hover:bg-primary-500 hover:text-white hover:border-primary-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150"
          >
            <Plus size={14} weight="bold" />
            <span className="hidden sm:inline">Create Form</span>
          </motion.button>

          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/25 hover:border-white/50 transition-colors"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name ?? "Avatar"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-white/15 flex items-center justify-center text-[10px] font-bold text-white">
                  {initials}
                </div>
              )}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.08, ease: "easeOut" }}
                  className="absolute right-0 top-10 w-52 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100/80 overflow-hidden select-none"
                >
                  <div className="px-3.5 pt-3 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center shrink-0">
                        {user?.image ? (
                          <img
                            src={user.image}
                            alt={user.name ?? "Avatar"}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-primary-600">
                            {initials}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {user?.name ?? "My Account"}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {user?.email ?? ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 mx-2" />

                  <div className="p-1.5">
                    <button
                      onClick={handleSignOut}
                      className="group w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 hover:font-bold active:bg-red-100 transition-colors text-left rounded-lg"
                    >
                      <SignOut
                        size={14}
                        className="shrink-0 transition-transform group-hover:scale-110 group-active:scale-95"
                      />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            className="sm:hidden w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X size={16} weight="bold" className="text-white" />
            ) : (
              <List size={16} weight="bold" className="text-white" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="sm:hidden absolute top-14 inset-x-0 z-10 bg-primary-900 border-t border-white/10 shadow-xl"
          >
            <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col gap-0.5">
              {NAV_ITEMS.map(({ label, path }) => {
                const active = pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(path);
                      setMobileOpen(false);
                    }}
                    className={`px-3 py-2.5 text-sm rounded text-left transition-colors ${
                      active
                        ? "text-white bg-white/15 font-medium"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
