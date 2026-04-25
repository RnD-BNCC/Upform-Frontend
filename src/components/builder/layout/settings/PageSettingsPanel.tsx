import { useState } from 'react'
import {
  CaretDownIcon,
  CaretUpIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  ArrowsHorizontalIcon,
} from '@phosphor-icons/react'
import type { FormSection } from '@/types/form'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-150 shrink-0 ${checked ? 'bg-primary-500' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}

function Section({ label, children, defaultOpen = true }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-gray-100">
      <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors" onClick={() => setOpen(v => !v)}>
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider leading-none">{label}</span>
        {open ? <CaretUpIcon size={12} className="text-gray-400 shrink-0" /> : <CaretDownIcon size={12} className="text-gray-400 shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

type Props = {
  section: FormSection
  onChange: (updates: Partial<FormSection>) => void
}

export default function PageSettingsPanel({ section, onChange }: Props) {
  const nb = section.settings?.nextButton as { text?: string; align?: 'left' | 'center' | 'right' | 'full'; color?: string; showSkip?: boolean } | undefined

  const updateNb = (updates: Partial<NonNullable<typeof nb>>) => {
    onChange({ settings: { ...section.settings, nextButton: { ...nb, ...updates } } })
  }

  return (
    <div className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden h-full">
      <div className="flex items-center px-4 py-3 border-b border-gray-100 shrink-0">
        <span className="text-sm font-semibold text-gray-900">Page settings</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Section label="Button">
          <div>
            <span className="text-xs font-medium text-gray-600 mb-1 block">Button text</span>
            <input
              type="text"
              value={nb?.text ?? ''}
              onChange={(e) => updateNb({ text: e.target.value || undefined })}
              placeholder="Next / Submit"
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 placeholder:text-gray-400"
            />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-600 mb-1 block">Alignment</span>
            <div className="flex gap-1">
              {([
                { value: 'left' as const, Icon: TextAlignLeftIcon },
                { value: 'center' as const, Icon: TextAlignCenterIcon },
                { value: 'right' as const, Icon: TextAlignRightIcon },
                { value: 'full' as const, Icon: ArrowsHorizontalIcon },
              ]).map(({ value, Icon }) => (
                <button key={value} type="button" onClick={() => updateNb({ align: value })}
                  className={`flex-1 py-1.5 flex justify-center rounded-md border transition-colors ${(nb?.align ?? 'left') === value ? 'border-primary-400 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-600 mb-1 block">Button color</span>
            <div className="flex items-center gap-2">
              <input type="color" value={nb?.color ?? '#0054a5'} onChange={(e) => updateNb({ color: e.target.value })}
                className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5" />
              <input type="text" value={nb?.color ?? ''} onChange={(e) => updateNb({ color: e.target.value || undefined })}
                placeholder="#0054a5"
                className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 placeholder:text-gray-400" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Show skip button</span>
            <Toggle checked={nb?.showSkip ?? false} onChange={(v) => updateNb({ showSkip: v || undefined })} />
          </div>
        </Section>
      </div>
    </div>
  )
}
