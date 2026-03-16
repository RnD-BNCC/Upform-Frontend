type Props = {
  placeholder?: string;
  onChange: (placeholder: string | undefined) => void;
};

export default function EmailField({ placeholder, onChange }: Props) {
  return (
    <input
      type="text"
      value={placeholder ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      onClick={(e) => e.stopPropagation()}
      placeholder="email@example.com"
      className="w-full border-b border-transparent hover:border-gray-300 focus:border-gray-400 pb-1 text-[15px] text-gray-400 bg-transparent outline-none transition-colors"
    />
  );
}
