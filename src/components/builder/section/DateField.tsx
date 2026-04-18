import { CalendarBlankIcon } from '@phosphor-icons/react'

export default function DateField() {
  return (
    <div className="inline-flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-white pointer-events-none w-48">
      <span className="flex-1 text-sm text-gray-300">MM/DD/YYYY</span>
      <CalendarBlankIcon size={14} className="text-gray-300 shrink-0" />
    </div>
  );
}
