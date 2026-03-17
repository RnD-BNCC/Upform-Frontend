import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import GoogleIcon from "@/components/ui/GoogleIcon";

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

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({ provider: "google", callbackURL: "/" });
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
          <p className="mb-6 text-center text-2xl italic font-semibold text-primary-500">
            UpForm
          </p>

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
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-3 border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-primary-500 hover:bg-primary-500 hover:text-white"
          >
            <GoogleIcon />
            Sign in with Google
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
        </div>
      </motion.div>

      <p className="mt-6 text-center text-xs text-white/60">
        © {new Date().getFullYear()} UpForm. All Rights Reserved.
      </p>
    </div>
  );
}
