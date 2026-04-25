import { motion } from "framer-motion";
import {
  ArrowsOutSimpleIcon,
  CopySimpleIcon,
  LinkSimpleIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react";

type RecordActionMenuProps = {
  deleteCount?: number;
  isBusy?: boolean;
  left: number;
  top: number;
  onCopyRecordId: () => void;
  onDeleteRecord: () => void;
  onDuplicateRecord: () => void;
  onExpandRecord: () => void;
};

export default function RecordActionMenu({
  deleteCount = 1,
  isBusy = false,
  left,
  onCopyRecordId,
  onDeleteRecord,
  onDuplicateRecord,
  onExpandRecord,
  top,
}: RecordActionMenuProps) {
  const isBulkAction = deleteCount > 1;

  return (
    <motion.div
      data-record-action-menu="true"
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.08, ease: "easeOut" }}
      className="fixed z-[130] w-44 select-none overflow-hidden rounded-sm border border-gray-100/80 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)]"
      style={{ left, top }}
    >
      {!isBulkAction ? (
        <>
          <div className="space-y-0.5 py-1">
            <button
              type="button"
              disabled={isBusy}
              onClick={onDuplicateRecord}
              className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CopySimpleIcon
                size={12}
                className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
              />
              Duplicate record
            </button>
            <button
              type="button"
              onClick={onExpandRecord}
              className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
            >
              <ArrowsOutSimpleIcon
                size={12}
                className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
              />
              Expand record
            </button>
            <button
              type="button"
              onClick={onCopyRecordId}
              className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
            >
              <LinkSimpleIcon
                size={12}
                className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
              />
              Copy record ID
            </button>
          </div>

          <div className="h-px bg-gray-100" />
        </>
      ) : null}

      <div className="py-1">
        <button
          type="button"
          disabled={isBusy}
          onClick={onDeleteRecord}
          className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <TrashSimpleIcon
            size={12}
            className="shrink-0 transition-transform group-hover:scale-110 group-active:scale-95"
          />
          {isBulkAction ? `Delete ${deleteCount} records` : "Delete record"}
        </button>
      </div>
    </motion.div>
  );
}
