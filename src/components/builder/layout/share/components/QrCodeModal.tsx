import { forwardRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CopyIcon, DownloadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { QRCodeCanvas } from "qrcode.react";
import type { ShareToast } from "@/types/builderShare";

type QrCodeModalProps = {
  onClose: () => void;
  onDownload: () => void;
  publicFormUrl: string;
  showToast?: ShareToast;
};

const QrCodeModal = forwardRef<HTMLCanvasElement, QrCodeModalProps>(
  ({ onClose, onDownload, publicFormUrl, showToast }, qrRef) =>
    createPortal(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-220 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-sm overflow-hidden rounded-sm bg-white p-6 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <XIcon size={18} />
          </button>
          <h3 className="text-base font-bold text-gray-900">
            QR code share link
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Share or print this QR code to give people access to your form from
            their mobile device.
          </p>
          <div className="mt-5 flex justify-center">
            <QRCodeCanvas ref={qrRef} value={publicFormUrl} size={180} level="M" />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(publicFormUrl);
                  showToast?.("Link copied");
                } catch {
                  showToast?.("Failed to copy", "error");
                }
              }}
              className="flex h-9 items-center gap-2 rounded-sm border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <CopyIcon size={14} />
              Copy
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="flex h-9 items-center gap-2 rounded-sm bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              <DownloadSimpleIcon size={14} weight="bold" />
              Download
            </button>
          </div>
        </motion.div>
      </motion.div>,
      document.body,
    ),
);

QrCodeModal.displayName = "QrCodeModal";

export default QrCodeModal;
