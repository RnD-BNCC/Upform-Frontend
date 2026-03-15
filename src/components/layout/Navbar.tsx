import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  User,
  List,
  X,
  GearSix,
  SignOut,
  UserCircle,
} from "@phosphor-icons/react";

const NAV_ITEMS = [
  { label: "My Forms", path: "/" },
  { label: "Templates", path: "/templates" },
];

const PROFILE_ITEMS = [
  { label: "Profile", Icon: UserCircle, onClick: () => {} },
  { label: "Settings", Icon: GearSix, onClick: () => {} },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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
            onClick={() => navigate(`/events/${crypto.randomUUID()}`)}
            className="flex items-center gap-1.5 bg-white text-primary-900 px-3 sm:px-3.5 py-1.5 text-xs font-bold tracking-widest uppercase border-2 border-primary-900 shadow-[2px_2px_0px_0px_#001d3a] hover:bg-primary-500 hover:text-white hover:border-primary-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150"
          >
            <Plus size={14} weight="bold" />
            <span className="hidden sm:inline">Create Form</span>
          </motion.button>

          {/* Profile button + dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                profileOpen
                  ? "bg-white/25 border-white/40"
                  : "bg-white/15 border-white/25 hover:bg-white/25"
              }`}
            >
              <User size={15} weight="bold" className="text-white" />
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
                  {/* User info header */}
                  <div className="px-3.5 pt-3 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <User
                          size={15}
                          weight="bold"
                          className="text-primary-600"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          My Account
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          user@example.com
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 mx-2" />

                  <div className="p-1.5 space-y-0.5">
                    {PROFILE_ITEMS.map(({ label, Icon, onClick }) => (
                      <button
                        key={label}
                        onClick={() => {
                          onClick();
                          setProfileOpen(false);
                        }}
                        className="group w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-colors text-left rounded-lg"
                      >
                        <Icon
                          size={14}
                          className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors"
                        />
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="h-px bg-gray-100 mx-2" />

                  <div className="p-1.5">
                    <button
                      onClick={() => setProfileOpen(false)}
                      className="group w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 hover:font-bold active:bg-red-100 transition-colors text-left rounded-lg"
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

      {/* Mobile menu */}
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
