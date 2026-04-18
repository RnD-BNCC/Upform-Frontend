import { CaretDownIcon } from '@phosphor-icons/react'

export default function TimeField() {
  return (
    <div className="inline-flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-white pointer-events-none w-36">
      <span className="flex-1 text-sm text-gray-300">--:--</span>
      <CaretDownIcon size={12} className="text-gray-400 shrink-0" />
    </div>
  );
}
