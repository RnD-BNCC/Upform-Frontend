import type { SlideType, SlideSettings } from '@/types/polling'
import ColorPickerDropdown from '@/components/ui/ColorPickerDropdown'
import { COLOR_PRESETS } from '@/config/polling'
import type { ThemePreset } from '@/config/polling'
import {
  TypeDropdown,
  OptionsEditor,
  CorrectAnswersEditor,
  Toggle,
  ThemeGrid,
  ImageUpload,
  LayoutPicker,
  ScaleStatementsEditor,
} from './settings'

export default function SettingsPanel({
  type,
  options,
  settings,
  onTypeChange,
  onOptionsChange,
  onSettingsChange,
  onBlur,
}: {
  type: SlideType
  options: string[]
  settings: SlideSettings
  onTypeChange: (type: SlideType) => void
  onOptionsChange: (options: string[]) => void
  onSettingsChange: (settings: SlideSettings) => void
  onBlur: () => void
}) {
  const needsOptions = ['multiple_choice'].includes(type)

  const handleSettingsField = <K extends keyof SlideSettings>(key: K, value: SlideSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  const handleApplyTheme = (theme: ThemePreset) => {
    onSettingsChange({ ...settings, bgColor: theme.bgColor, textColor: theme.textColor })
    onBlur()
  }

  return (
    <div className="w-72 bg-white border-l border-gray-100 h-screen sticky top-0 overflow-y-auto hidden lg:flex flex-col">
      <div className="px-4 pt-5 pb-3 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slide</h3>
      </div>

      <div className="flex flex-col p-4 flex-1">
        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Question type</label>
          <TypeDropdown value={type} onChange={onTypeChange} />
        </div>

        {needsOptions && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Answer options</label>
            <OptionsEditor
              options={options}
              onChange={onOptionsChange}
              onBlur={onBlur}
              correctAnswer={type === 'multiple_choice' ? settings.correctAnswer : undefined}
              onCorrectAnswerChange={type === 'multiple_choice' ? (answer) => {
                onSettingsChange({ ...settings, correctAnswer: answer })
                onBlur()
              } : undefined}
              colors={type === 'multiple_choice' ? settings.barColors : undefined}
              onColorsChange={type === 'multiple_choice' ? (colors) => {
                onSettingsChange({ ...settings, barColors: colors })
                onBlur()
              } : undefined}
            />
          </div>
        )}

        {type === 'word_cloud' && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Correct answers</label>
            <p className="text-[10px] text-gray-400 mb-2">Add accepted answers for scoring. Leave empty for no scoring.</p>
            <CorrectAnswersEditor
              answers={settings.correctAnswers ?? []}
              onChange={(answers) => onSettingsChange({ ...settings, correctAnswers: answers })}
              onBlur={onBlur}
            />
          </div>
        )}

        <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Response timer</label>
            <div className="flex gap-1.5 mb-2">
              {[0, 15, 30, 60].map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    onSettingsChange({ ...settings, timer: sec === 0 ? undefined : sec })
                    onBlur()
                  }}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-lg border-2 cursor-pointer transition-colors ${
                    (settings.timer ?? 0) === sec
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-500'
                  }`}
                >
                  {sec === 0 ? 'Off' : `${sec}s`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={300}
                value={settings.timer ?? ''}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  onSettingsChange({ ...settings, timer: v > 0 ? v : undefined })
                }}
                onBlur={onBlur}
                placeholder="Custom (sec)"
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
              />
              <span className="text-xs text-gray-400 font-medium shrink-0">sec</span>
            </div>
          </div>

        {type === 'scales' && (
          <>
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Statements</label>
              <p className="text-[10px] text-gray-400 mb-2">Add statements for audience to rate. Drag to reorder.</p>
              <ScaleStatementsEditor
                statements={options}
                colors={settings.scaleColors ?? []}
                onChange={onOptionsChange}
                onColorsChange={(colors) => { onSettingsChange({ ...settings, scaleColors: colors }); onBlur() }}
                onBlur={onBlur}
              />
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Dimensions</label>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 font-medium mb-1 block">Bottom of the scale</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.scaleMinLabel ?? ''}
                      onChange={(e) => onSettingsChange({ ...settings, scaleMinLabel: e.target.value || undefined })}
                      onBlur={onBlur}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
                      placeholder="Strongly disagree"
                    />
                    <div className="w-16">
                      <input
                        type="number"
                        value={settings.scaleMin ?? 1}
                        onChange={(e) => {
                          const min = Number(e.target.value)
                          const max = settings.scaleMax ?? 10
                          onSettingsChange({ ...settings, scaleMin: min, scaleMax: Math.max(max, min + 1) })
                        }}
                        onBlur={onBlur}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white text-center"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 font-medium mb-1 block">Top of the scale</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.scaleMaxLabel ?? ''}
                      onChange={(e) => onSettingsChange({ ...settings, scaleMaxLabel: e.target.value || undefined })}
                      onBlur={onBlur}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
                      placeholder="Strongly agree"
                    />
                    <div className="w-16">
                      <input
                        type="number"
                        value={settings.scaleMax ?? 10}
                        onChange={(e) => {
                          const max = Number(e.target.value)
                          const min = settings.scaleMin ?? 1
                          onSettingsChange({ ...settings, scaleMax: Math.max(max, min + 1) })
                        }}
                        onBlur={onBlur}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {type === 'pin_on_image' && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Background image</label>
            <p className="text-[10px] text-gray-400 mb-2">Upload an image below. Audience members will tap on it to pin their answer.</p>
          </div>
        )}

        {type === 'guess_number' && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Correct number</label>
            <p className="text-[10px] text-gray-400 mb-2">Set the correct answer for scoring.</p>
            <input
              type="number"
              value={settings.correctNumber ?? ''}
              onChange={(e) => onSettingsChange({ ...settings, correctNumber: e.target.value ? Number(e.target.value) : undefined })}
              onBlur={onBlur}
              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white mb-3"
              placeholder="Enter the correct number"
            />
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Number range</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[11px] text-gray-400 font-medium mb-1 block">Min</label>
                <input
                  type="number"
                  value={settings.numberMin ?? 0}
                  onChange={(e) => onSettingsChange({ ...settings, numberMin: Number(e.target.value) })}
                  onBlur={onBlur}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-gray-400 font-medium mb-1 block">Max</label>
                <input
                  type="number"
                  value={settings.numberMax ?? 10}
                  onChange={(e) => onSettingsChange({ ...settings, numberMax: Number(e.target.value) })}
                  onBlur={onBlur}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Image</label>
          <ImageUpload
            imageUrl={settings.imageUrl}
            onUpload={(url) => {
              onSettingsChange({ ...settings, imageUrl: url, imageLayout: settings.imageLayout ?? 'above' })
              onBlur()
            }}
            onRemove={() => {
              onSettingsChange({ ...settings, imageUrl: undefined, imageLayout: undefined })
              onBlur()
            }}
          />
        </div>

        {settings.imageUrl && (
          <div className="mb-5">
            <LayoutPicker
              value={settings.imageLayout ?? 'above'}
              onChange={(layout) => {
                handleSettingsField('imageLayout', layout)
                onBlur()
              }}
            />
          </div>
        )}

        <div className="border-t border-gray-100 my-1" />

        <div className="py-4">
          <h4 className="text-xs font-bold text-gray-700 mb-3">Default themes</h4>
          <ThemeGrid settings={settings} onApply={handleApplyTheme} />
        </div>

        <div className="border-t border-gray-100 my-1" />

        <div className="py-4">
          <h4 className="text-xs font-bold text-gray-700 mb-3">Text</h4>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 font-medium">Visualization text color</span>
            <ColorPickerDropdown value={settings.textColor ?? '#374151'} onChange={(c) => { handleSettingsField('textColor', c); onBlur() }} colors={COLOR_PRESETS} />
          </div>
        </div>

        <div className="border-t border-gray-100 my-1" />

        <div className="py-4">
          <h4 className="text-xs font-bold text-gray-700 mb-3">Background</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Background color</span>
              <ColorPickerDropdown value={settings.bgColor ?? '#F3F4F6'} onChange={(c) => { handleSettingsField('bgColor', c); onBlur() }} colors={COLOR_PRESETS} />
            </div>
            <button
              onClick={() => { onSettingsChange({ ...settings, textColor: undefined, bgColor: undefined }); onBlur() }}
              className="text-xs text-primary-400 font-medium self-start mt-1 cursor-pointer hover:text-primary-500 transition-colors"
            >
              Reset to theme defaults
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 my-1" />

        <div className="py-4">
          <h4 className="text-xs font-bold text-gray-700 mb-3">Joining instructions</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Display QR code</span>
              <Toggle checked={settings.showQrCode !== false} onChange={(v) => { handleSettingsField('showQrCode', v); onBlur() }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Display instructions bar</span>
              <Toggle checked={settings.showInstructionsBar !== false} onChange={(v) => { handleSettingsField('showInstructionsBar', v); onBlur() }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
