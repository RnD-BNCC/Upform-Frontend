type ColorInputFieldProps = {
  label?: string;
  onChange: (color: string) => void;
  value: string;
};

export default function ColorInputField({
  label,
  onChange,
  value,
}: ColorInputFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {label ? (
        <span className="min-w-0 text-xs font-medium text-gray-600">
          {label}
        </span>
      ) : null}
      <label
        className="relative flex h-9 w-16 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-gray-200 bg-white p-1.5 transition-colors hover:border-gray-300"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span
          className="block h-full w-full rounded-sm"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={label ? `Pick ${label.toLowerCase()} color` : "Pick color"}
        />
      </label>
    </div>
  );
}
