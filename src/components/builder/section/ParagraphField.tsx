type Props = {
  placeholder?: string;
  onChange: (placeholder: string | undefined) => void;
};

export default function ParagraphField({ placeholder, onChange }: Props) {
  return (
    <textarea
      value={placeholder ?? ""}
      onChange={(e) => {
        onChange(e.target.value || undefined);
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      onClick={(e) => e.stopPropagation()}
      placeholder="Long answer text"
      rows={2}
      className="w-full border-b border-transparent hover:border-gray-300 focus:border-gray-400 pb-1 text-[15px] text-gray-400 bg-transparent outline-none resize-none overflow-hidden transition-colors"
    />
  );
}
