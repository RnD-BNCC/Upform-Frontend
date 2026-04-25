import { CaretDownIcon, XIcon } from "@phosphor-icons/react";

type ManualRecipientInputProps = {
  inputValue: string;
  recipients: string[];
  onAdd: () => void;
  onInputChange: (value: string) => void;
  onRemove: (email: string) => void;
};

export default function ManualRecipientInput({
  inputValue,
  recipients,
  onAdd,
  onInputChange,
  onRemove,
}: ManualRecipientInputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-900">
        Send to <span className="text-red-500">*</span>
      </label>
      <div className="flex min-h-11 w-full items-center gap-2 rounded-md border border-gray-900 bg-white px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-gray-900/10">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {recipients.map((email) => (
            <span
              key={email}
              className="inline-flex max-w-full items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
            >
              <span className="max-w-48 truncate">{email}</span>
              <button
                type="button"
                onClick={() => onRemove(email)}
                className="text-gray-500 transition-colors hover:text-gray-900"
                aria-label={`Remove ${email}`}
              >
                <XIcon size={12} weight="bold" />
              </button>
            </span>
          ))}
          <input
            type="email"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onBlur={() => {
              if (inputValue.trim()) onAdd();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === "," || event.key === ";") {
                event.preventDefault();
                onAdd();
              }
              if (
                event.key === "Backspace" &&
                !inputValue &&
                recipients.length > 0
              ) {
                onRemove(recipients[recipients.length - 1]);
              }
            }}
            placeholder={recipients.length === 0 ? "name@example.com" : ""}
            className="h-7 min-w-32 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
        </div>
        <span className="h-6 w-px bg-gray-300" />
        <CaretDownIcon size={18} weight="bold" className="text-gray-600" />
      </div>
    </div>
  );
}
