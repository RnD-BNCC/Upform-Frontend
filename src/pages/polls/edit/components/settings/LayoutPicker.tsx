import type { ImageLayout } from '@/types/polling'
import { IMAGE_LAYOUTS } from '@/config/polling'
import LayoutIcon from '@/components/ui/LayoutIcon'

export default function LayoutPicker({
  value,
  onChange,
}: {
  value: ImageLayout
  onChange: (layout: ImageLayout) => void
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-2 block">Layout</label>
      <div className="grid grid-cols-3 gap-1.5">
        {IMAGE_LAYOUTS.map((l) => {
          const isActive = value === l.value
          return (
            <button
              key={l.value}
              onClick={() => onChange(l.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                isActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <LayoutIcon layout={l.value} active={isActive} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
