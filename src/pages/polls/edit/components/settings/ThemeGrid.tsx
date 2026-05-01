import type { SlideSettings } from '@/types/polling'
import { THEME_PRESETS } from '@/config/polling'
import type { ThemePreset } from '@/config/polling'
import { Check } from '@phosphor-icons/react'

export default function ThemeGrid({ settings, onApply }: { settings: SlideSettings; onApply: (theme: ThemePreset) => void }) {
  const currentThemeId = THEME_PRESETS.find((t) => t.bgColor === settings.bgColor && t.textColor === settings.textColor)?.id

  return (
    <div className="grid grid-cols-2 gap-2">
      {THEME_PRESETS.map((theme) => {
        const isActive = theme.id === currentThemeId
        return (
          <button
            key={theme.id}
            onClick={() => onApply(theme)}
            className={`relative flex cursor-pointer flex-col rounded-sm border p-2.5 transition-all hover:border-gray-300 ${isActive ? 'border-primary-500 shadow-sm' : 'border-gray-200'}`}
          >
            <div className="flex aspect-16/10 w-full items-end gap-1 rounded-sm p-2" style={{ backgroundColor: theme.bgColor }}>
              {theme.barColors.map((color, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ backgroundColor: color, height: `${40 + i * 20}%` }} />
              ))}
            </div>
            <span className="text-[11px] font-semibold mt-1.5 text-center truncate" style={{ color: isActive ? '#0054a5' : '#6B7280' }}>
              {theme.name}
            </span>
            {isActive && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-500 text-white flex items-center justify-center">
                <Check size={10} weight="bold" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
