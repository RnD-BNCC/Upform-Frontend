import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { GoogleBrandIcon, SpinnerArcIcon } from "@/components/icons";
import { BrandLogo } from "@/components/layout";
import { authClient } from "@/lib";

const GREETINGS = [
  "Hello",
  "Halo",
  "Bonjour",
  "Hola",
  "こんにちは",
  "안녕하세요",
  "مرحبا",
  "你好",
  "Hallo",
  "Olá",
];

function useTypewriter(words: string[], speed = 100, pause = 1500) {
  const [displayed, setDisplayed] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex];

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setDisplayed(current.slice(0, displayed.length + 1));
          if (displayed.length + 1 === current.length) {
            setTimeout(() => setIsDeleting(true), pause);
          }
        } else {
          setDisplayed(current.slice(0, displayed.length - 1));
          if (displayed.length - 1 === 0) {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? speed / 2 : speed,
    );

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIndex, words, speed, pause]);

  return displayed;
}

export default function LoginPage() {
  const greeting = useTypewriter(GREETINGS);
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const getCallbackUrl = () => {
    const redirect = new URLSearchParams(location.search).get("redirect");
    const safeRedirect =
      redirect && redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : "/";
    return `${window.location.origin}${safeRedirect}`;
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: getCallbackUrl(),
    });
  };

  return (
    <div className="animate-gradient flex min-h-screen flex-col items-center justify-center">
      <motion.div
        className="w-full max-w-[320px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="bg-white px-10 py-10 shadow-md">
          <BrandLogo className="mx-auto mb-7 h-10 w-auto max-w-[180px]" />

          <div className="mb-8">
            <p className="text-[#3d3d3d] text-xl">
              {greeting}
              <span className="animate-pulse font-thin">|</span>
            </p>
            <p className="text-[#3d3d3d] text-xl font-bold">Welcome</p>
            <p className="mt-2 text-xs text-gray-400">
              We're glad you're here! Sign in to get started and discover more.
            </p>
          </div>

          <motion.button
            onClick={handleGoogleSignIn}
            disabled={loading}
            whileTap={loading ? undefined : { scale: 0.98 }}
            className="flex w-full font-bold items-center justify-center gap-3 border border-gray-200 bg-white px-4 py-2.5 text-sm  text-gray-400 transition-colors duration-150 hover:border-primary-500 hover:bg-primary-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-700"
          >
            {loading ? (
              <SpinnerArcIcon size={16} className="animate-spin" />
            ) : (
              <GoogleBrandIcon />
            )}
            {loading ? "Signing in..." : "Sign in with Google"}
          </motion.button>

          <p className="mt-5 text-center text-xs text-gray-400">
            Can't sign in?{" "}
            <a
              href="mailto:contact@bncc.net"
              className="text-gray-500 underline"
            >
              Contact us
            </a>
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 text-[10px] font-semibold text-gray-400">
            <Link to="/privacy-policy" className="underline hover:text-gray-600">
              Privacy Policy
            </Link>
            <span>/</span>
            <Link to="/terms-of-service" className="underline hover:text-gray-600">
              Terms
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 flex justify-center gap-3 text-xs text-white/70">
        <Link to="/privacy-policy" className="underline hover:text-white">
          Privacy Policy
        </Link>
        <Link to="/terms-of-service" className="underline hover:text-white">
          Terms of Service
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-white/60">
        © {new Date().getFullYear()} UpForm. All Rights Reserved.
      </p>
    </div>
  );
}
