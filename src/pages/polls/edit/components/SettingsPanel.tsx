import { useState } from 'react'
import { LayoutPicker } from '@/components/layout'
import type { SlideType, SlideSettings } from '@/types/polling'
import { ColorPickerDropdown } from '@/components/ui'
import { COLOR_PRESETS } from '@/config/polling'
import type { ThemePreset } from '@/config/polling'
import {
  TypeDropdown,
  OptionsEditor,
  CorrectAnswersEditor,
  Toggle,
  ThemeGrid,
  ImageUpload,
  ScaleStatementsEditor,
  CorrectAreaPicker,
} from './settings'

const fieldLabelClassName = "mb-2 block text-xs font-medium text-gray-600"
const hintClassName = "mb-2 text-xs leading-4 text-gray-400"
const flexInputClassName =
  "h-9 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
const textInputClassName =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
const numberInputClassName =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-center text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300"

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
  const [showAreaPicker, setShowAreaPicker] = useState(false)

  const handleSettingsField = <K extends keyof SlideSettings>(key: K, value: SlideSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  const handleApplyTheme = (theme: ThemePreset) => {
    onSettingsChange({ ...settings, bgColor: theme.bgColor, textColor: theme.textColor })
    onBlur()
  }

  return (
    <div className="hidden h-screen w-72 shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-gray-50 lg:flex">
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Slide</h3>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <div className="mb-5">
          <label className={fieldLabelClassName}>Question type</label>
          <TypeDropdown value={type} onChange={onTypeChange} />
        </div>

        {needsOptions && (
          <div className="mb-5">
            <label className={fieldLabelClassName}>Answer options</label>
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
            <label className={fieldLabelClassName}>Correct answers</label>
            <p className={hintClassName}>Add accepted answers for scoring. Leave empty for no scoring.</p>
            <CorrectAnswersEditor
              answers={settings.correctAnswers ?? []}
              onChange={(answers) => onSettingsChange({ ...settings, correctAnswers: answers })}
              onBlur={onBlur}
            />
          </div>
        )}

        {type !== 'guess_number' && (
          <div className="mb-5">
            <label className={fieldLabelClassName}>Response timer</label>
            <div className="mb-2 flex rounded-lg border border-gray-200 bg-white p-0.5">
              {[0, 15, 30, 60].map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    onSettingsChange({ ...settings, timer: sec === 0 ? undefined : sec })
                    onBlur()
                  }}
                  className={`h-8 flex-1 cursor-pointer rounded-md text-xs font-medium transition-colors ${
                    (settings.timer ?? 0) === sec
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
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
                className={flexInputClassName}
              />
              <span className="text-xs text-gray-400 font-medium shrink-0">sec</span>
            </div>
          </div>
        )}

        {type === 'scales' && (
          <>
            <div className="mb-5">
              <label className={fieldLabelClassName}>Statements</label>
              <p className={hintClassName}>Add statements for audience to rate. Drag to reorder.</p>
              <ScaleStatementsEditor
                statements={options}
                colors={settings.scaleColors ?? []}
                onChange={onOptionsChange}
                onColorsChange={(colors) => { onSettingsChange({ ...settings, scaleColors: colors }); onBlur() }}
                onBlur={onBlur}
              />
            </div>

            <div className="mb-5">
              <label className={fieldLabelClassName}>Dimensions</label>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-400">Bottom of the scale</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.scaleMinLabel ?? ''}
                      onChange={(e) => onSettingsChange({ ...settings, scaleMinLabel: e.target.value || undefined })}
                      onBlur={onBlur}
                      className={flexInputClassName}
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
                        className={numberInputClassName}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-400">Top of the scale</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.scaleMaxLabel ?? ''}
                      onChange={(e) => onSettingsChange({ ...settings, scaleMaxLabel: e.target.value || undefined })}
                      onBlur={onBlur}
                      className={flexInputClassName}
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
                        className={numberInputClassName}
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
            <label className={fieldLabelClassName}>Background image</label>
            <p className={hintClassName}>Audience members will tap on it to pin their answer.</p>
            <ImageUpload
              imageUrl={settings.pinImageUrl}
              onUpload={(url) => {
                onSettingsChange({ ...settings, pinImageUrl: url })
                onBlur()
              }}
              onRemove={() => {
                onSettingsChange({ ...settings, pinImageUrl: undefined, correctArea: undefined })
                onBlur()
              }}
            />
          </div>
        )}

        {type === 'pin_on_image' && (
          <div className="mb-5">
            <label className={fieldLabelClassName}>Correct area</label>
            {!settings.pinImageUrl ? (
              <p className="text-xs leading-4 text-gray-400">Upload an image first to set a correct area.</p>
            ) : settings.correctArea ? (
              <div className="flex flex-col gap-2">
                <div className="relative overflow-hidden rounded-sm border border-green-200">
                  <img src={settings.pinImageUrl} alt="" className="w-full object-cover" />
                  <div
                    className="absolute pointer-events-none border-2 border-green-500"
                    style={{
                      left: `${settings.correctArea.x}%`,
                      top: `${settings.correctArea.y}%`,
                      width: `${settings.correctArea.width}%`,
                      height: `${settings.correctArea.height}%`,
                      backgroundColor: 'rgba(34,197,94,0.2)',
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAreaPicker(true)}
                    className="h-8 flex-1 cursor-pointer rounded-sm border border-gray-200 bg-white text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { onSettingsChange({ ...settings, correctArea: undefined }); onBlur() }}
                    className="h-8 flex-1 cursor-pointer rounded-sm border border-red-100 bg-white text-xs font-semibold text-red-400 transition-colors hover:border-red-200 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAreaPicker(true)}
                className="h-9 w-full cursor-pointer rounded-sm border border-dashed border-gray-200 bg-white text-xs font-semibold text-gray-400 transition-colors hover:border-primary-300 hover:text-primary-500"
              >
                + Set correct area
              </button>
            )}
          </div>
        )}

        {showAreaPicker && settings.pinImageUrl && (
          <CorrectAreaPicker
            imageUrl={settings.pinImageUrl}
            value={settings.correctArea}
            onChange={(area) => { onSettingsChange({ ...settings, correctArea: area }); onBlur() }}
            onClose={() => setShowAreaPicker(false)}
          />
        )}

        {type === 'guess_number' && (
          <div className="mb-5">
            <label className={fieldLabelClassName}>Correct number</label>
            <p className={hintClassName}>Set the correct answer for scoring.</p>
            <input
              type="number"
              value={settings.correctNumber ?? ''}
              onChange={(e) => onSettingsChange({ ...settings, correctNumber: e.target.value ? Number(e.target.value) : undefined })}
              onBlur={onBlur}
              className={`${textInputClassName} mb-3`}
              placeholder="Enter the correct number"
            />
            <label className={fieldLabelClassName}>Number range</label>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-gray-400">Min</label>
                <input
                  type="number"
                  value={settings.numberMin ?? 0}
                  onChange={(e) => onSettingsChange({ ...settings, numberMin: Number(e.target.value) })}
                  onBlur={onBlur}
                  className={textInputClassName}
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[11px] font-medium text-gray-400">Max</label>
                <input
                  type="number"
                  value={settings.numberMax ?? 10}
                  onChange={(e) => onSettingsChange({ ...settings, numberMax: Number(e.target.value) })}
                  onBlur={onBlur}
                  className={textInputClassName}
                />
              </div>
            </div>
            <label className={fieldLabelClassName}>Response timer</label>
            <div className="mb-2 flex rounded-lg border border-gray-200 bg-white p-0.5">
              {[0, 15, 30, 60].map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    onSettingsChange({ ...settings, timer: sec === 0 ? undefined : sec })
                    onBlur()
                  }}
                  className={`h-8 flex-1 cursor-pointer rounded-md text-xs font-medium transition-colors ${
                    (settings.timer ?? 0) === sec
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
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
                className={flexInputClassName}
              />
              <span className="text-xs text-gray-400 font-medium shrink-0">sec</span>
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className={fieldLabelClassName}>Image</label>
          <p className={hintClassName}>
            {type === 'pin_on_image'
              ? 'Optional decorative image shown alongside the pin area (not interactive).'
              : 'Optional image shown alongside the question.'}
          </p>
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
          <h4 className="mb-3 text-xs font-semibold uppercase leading-none tracking-wider text-gray-700">Default themes</h4>
          <ThemeGrid settings={settings} onApply={handleApplyTheme} />
        </div>

        <div className="border-t border-gray-100 my-1" />

        <div className="py-4">
          <h4 className="mb-3 text-xs font-semibold uppercase leading-none tracking-wider text-gray-700">Text</h4>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Visualization text color</span>
            <ColorPickerDropdown value={settings.textColor ?? '#374151'} onChange={(c) => { handleSettingsField('textColor', c); onBlur() }} colors={COLOR_PRESETS} />
          </div>
        </div>

        <div className="border-t border-gray-100 my-1" />

        <div className="py-4">
          <h4 className="mb-3 text-xs font-semibold uppercase leading-none tracking-wider text-gray-700">Background</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Background color</span>
              <ColorPickerDropdown value={settings.bgColor ?? '#F3F4F6'} onChange={(c) => { handleSettingsField('bgColor', c); onBlur() }} colors={COLOR_PRESETS} />
            </div>
            <button
              onClick={() => { onSettingsChange({ ...settings, textColor: undefined, bgColor: undefined }); onBlur() }}
              className="mt-1 cursor-pointer self-start text-xs font-medium text-primary-500 transition-colors hover:text-primary-600"
            >
              Reset to theme defaults
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 my-1" />

        <div className="py-4">
          <h4 className="mb-3 text-xs font-semibold uppercase leading-none tracking-wider text-gray-700">Joining instructions</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Display QR code</span>
              <Toggle checked={settings.showQrCode !== false} onChange={(v) => { handleSettingsField('showQrCode', v); onBlur() }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Display instructions bar</span>
              <Toggle checked={settings.showInstructionsBar !== false} onChange={(v) => { handleSettingsField('showInstructionsBar', v); onBlur() }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
