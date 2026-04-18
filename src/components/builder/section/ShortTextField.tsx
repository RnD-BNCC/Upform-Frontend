type Props = {
  placeholder?: string;
  defaultValue?: string;
  onChange: (placeholder: string | undefined) => void;
};

export default function ShortTextField({ placeholder, defaultValue, onChange }: Props) {
  return (
    <input
      type="text"
      value={defaultValue !== undefined ? defaultValue : (placeholder ?? '')}
      readOnly={defaultValue !== undefined}
      onChange={defaultValue !== undefined ? undefined : (e) => onChange(e.target.value || undefined)}
      onClick={(e) => e.stopPropagation()}
      placeholder=""
      className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-transparent outline-none transition-colors ${
        defaultValue !== undefined
          ? 'text-gray-600 cursor-default'
          : 'text-gray-400 hover:border-gray-300 focus:border-primary-400'
      }`}
    />
  );
}
