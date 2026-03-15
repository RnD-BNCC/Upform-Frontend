type Props = {
  placeholder?: string;
  onChange: (placeholder: string | undefined) => void;
};

export default function ShortTextField({ placeholder, onChange }: Props) {
  return (
    <input
      type="text"
      value={placeholder ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      onClick={(e) => e.stopPropagation()}
      placeholder="Short answer text"
      className="w-full border-b border-transparent hover:border-gray-300 focus:border-gray-400 pb-1 text-[15px] text-gray-400 bg-transparent outline-none transition-colors"
    />
  );
}
