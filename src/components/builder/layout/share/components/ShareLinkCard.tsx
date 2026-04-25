import { motion } from "framer-motion";
import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  CopyIcon,
  InstagramLogoIcon,
  QrCodeIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";
import type { ShareToast } from "@/types/builderShare";

type ShareLinkCardProps = {
  copied: boolean;
  onCopy: () => void;
  onShowQr: () => void;
  publicFormUrl: string;
  showToast?: ShareToast;
};

export default function ShareLinkCard({
  copied,
  onCopy,
  onShowQr,
  publicFormUrl,
  showToast,
}: ShareLinkCardProps) {
  return (
    <div className="mt-8 overflow-hidden rounded-sm border border-gray-200 bg-white">
      <div className="bg-gray-50/70 p-5">
        <div className="flex items-center rounded-sm border border-gray-200 bg-white px-4">
          <span className="min-w-0 flex-1 truncate py-3 text-sm text-gray-700">
            {publicFormUrl}
          </span>
          <button
            type="button"
            onClick={() => window.open(publicFormUrl, "_blank")}
            className="ml-2 shrink-0 text-gray-400 transition-colors hover:text-gray-700"
            aria-label="Open form"
          >
            <ArrowSquareOutIcon size={17} />
          </button>
          <div className="mx-3 h-5 w-px bg-gray-200" />
          <motion.button
            type="button"
            onClick={onCopy}
            animate={copied ? { scale: [1, 0.92, 1] } : {}}
            transition={{ duration: 0.18 }}
            className={`flex shrink-0 items-center gap-2 rounded-sm px-4 py-2 text-sm font-bold text-white transition-colors ${
              copied
                ? "bg-emerald-500 hover:bg-emerald-500"
                : "bg-gray-900 hover:bg-gray-800"
            }`}
          >
            <motion.span
              key={copied ? "check" : "copy"}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              {copied ? (
                <CheckCircleIcon size={15} weight="fill" />
              ) : (
                <CopyIcon size={15} weight="fill" />
              )}
              {copied ? "Copied!" : "Copy"}
            </motion.span>
          </motion.button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onShowQr}
            className="text-gray-400 transition-colors hover:text-gray-700"
            aria-label="QR code"
          >
            <QrCodeIcon size={22} />
          </button>
          <button
            type="button"
            onClick={() =>
              window.open(
                `https://wa.me/?text=${encodeURIComponent(publicFormUrl)}`,
                "_blank",
              )
            }
            className="text-gray-400 transition-colors hover:text-green-600"
            aria-label="Share on WhatsApp"
          >
            <WhatsappLogoIcon size={22} />
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(publicFormUrl);
                showToast?.("Link copied - paste it on Instagram");
              } catch {
                showToast?.("Failed to copy link", "error");
              }
            }}
            className="text-gray-400 transition-colors hover:text-pink-600"
            aria-label="Share on Instagram"
          >
            <InstagramLogoIcon size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
