import { EnvelopeSimpleIcon } from '@phosphor-icons/react'

type Props = {
  placeholder?: string;
  defaultValue?: string;
  onChange: (placeholder: string | undefined) => void;
};

export default function EmailField({ placeholder, defaultValue, onChange }: Props) {
  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-transparent">
      <div className="flex items-center px-3 py-2.5 bg-gray-50 border-r border-gray-100 shrink-0">
        <EnvelopeSimpleIcon size={14} className="text-gray-400" />
      </div>
      <input
        type="text"
        value={defaultValue !== undefined ? defaultValue : (placeholder ?? '')}
        readOnly={defaultValue !== undefined}
        onChange={defaultValue !== undefined ? undefined : (e) => onChange(e.target.value || undefined)}
        onClick={(e) => e.stopPropagation()}
        placeholder=""
        className={`flex-1 px-3 py-2.5 text-sm bg-transparent outline-none transition-colors ${
          defaultValue !== undefined
            ? 'text-gray-600 cursor-default'
            : 'text-gray-400 hover:border-gray-300 focus:border-primary-400'
        }`}
      />
    </div>
  );
}
