type AuditLineProps = {
  label: string;
  value?: string | null;
};

export default function AuditLine({ label, value }: AuditLineProps) {
  const displayValue = value || "Unknown";

  return (
    <div className="flex items-center justify-between gap-3 text-[10px] leading-4">
      <span className="shrink-0 text-gray-400">{label}</span>
      <span
        className="min-w-0 truncate text-right font-semibold text-gray-600"
        title={displayValue}
      >
        {displayValue}
      </span>
    </div>
  );
}

