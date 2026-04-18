import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  CaretDownIcon,
  CaretUpIcon,
  XIcon,
  TrashIcon,
  PlusIcon,
  QuestionIcon,
} from '@phosphor-icons/react'
import type {
  FormField,
  FormSection,
  ConditionGroup,
  ConditionLeaf,
  ConditionNode,
  ConditionOperator,
} from '@/types/form'

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  isOpen: boolean
  field?: FormField
  sections?: FormSection[]
  onChange: (updates: Partial<FormField>) => void
  onClose: () => void
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-150 shrink-0 ${
        checked ? 'bg-primary-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({
  label,
  children,
  defaultOpen = true,
}: {
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-gray-100">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider leading-none">{label}</span>
        {open ? (
          <CaretUpIcon size={12} className="text-gray-400 shrink-0" />
        ) : (
          <CaretDownIcon size={12} className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

// ─── Tooltip label ────────────────────────────────────────────────────────────

function Label({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <span className="text-xs font-medium text-gray-600">{children}</span>
      {tooltip && (
        <span title={tooltip} className="text-gray-400 cursor-help">
          <QuestionIcon size={12} />
        </span>
      )}
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_TYPE_LABELS: Record<string, string> = {
  short_text: 'Short answer',
  paragraph: 'Long answer',
  multiple_choice: 'Multiple choice',
  checkbox: 'Checkboxes',
  dropdown: 'Dropdown',
  date: 'Date picker',
  time: 'Time picker',
  email: 'Email',
  file_upload: 'File upload',
  rating: 'Star rating',
  linear_scale: 'Slider',
  title_block: 'Heading',
  image_block: 'Image',
  banner_block: 'Banner',
  ranking: 'Ranking',
  opinion_scale: 'Opinion scale',
  rich_text: 'Rich text',
  phone: 'Phone number',
  address: 'Address',
  number: 'Number',
  currency: 'Currency',
}

const HAS_OPTIONS = ['multiple_choice', 'checkbox', 'dropdown']
const HAS_PLACEHOLDER = ['short_text', 'paragraph', 'email', 'phone', 'address', 'number', 'currency', 'rich_text']
const HAS_DEFAULT_VALUE = ['short_text', 'paragraph', 'email', 'number', 'phone', 'address', 'currency']
const HAS_VALIDATION = ['short_text', 'paragraph', 'email', 'phone', 'address', 'number', 'currency', 'rich_text']
const DISPLAY_ONLY = ['title_block', 'image_block', 'banner_block']
const NON_ANSWERABLE = ['image_block', 'title_block', 'banner_block']

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'is_filled', label: 'is filled' },
  { value: 'is_empty', label: 'is empty' },
]

const VALIDATION_PATTERNS: { value: string; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'number', label: 'Number only' },
]

// ─── Condition UI helpers ─────────────────────────────────────────────────────

function LogicBadge({ logic, onClick }: { logic: 'and' | 'or'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="inline-flex items-center justify-center gap-0.5 shrink-0 border border-gray-300 rounded px-1 py-0.5 text-[9px] font-bold text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors bg-white"
      style={{ minWidth: 34 }}
    >
      {logic}
      <CaretDownIcon size={7} />
    </button>
  )
}

// Single condition row: [badge|spacer] [field ▼] [operator ▼] [value] [🗑]
function ConditionLeafRow({
  leaf,
  hasSiblings,
  isLast,
  parentLogic,
  onToggleLogic,
  availableFields,
  onChange,
  onRemove,
}: {
  leaf: ConditionLeaf
  hasSiblings: boolean
  isLast: boolean
  parentLogic: 'and' | 'or'
  onToggleLogic: () => void
  availableFields: FormField[]
  onChange: (l: ConditionLeaf) => void
  onRemove: () => void
}) {
  const needsValue = leaf.operator !== 'is_filled' && leaf.operator !== 'is_empty'
  return (
    <div className="flex items-center gap-1">
      {/* Badge area */}
      {hasSiblings ? (
        isLast
          ? <div style={{ minWidth: 34 }} className="shrink-0" />
          : <LogicBadge logic={parentLogic} onClick={onToggleLogic} />
      ) : null}

      {/* Field selector */}
      <select
        value={leaf.fieldId}
        onChange={(e) => onChange({ ...leaf, fieldId: e.target.value })}
        className="flex-1 min-w-0 border border-gray-200 rounded-md px-1.5 py-1.5 text-[10px] text-gray-700 bg-white outline-none focus:border-primary-400 cursor-pointer"
      >
        <option value="" disabled>Select...</option>
        {availableFields.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label || FIELD_TYPE_LABELS[f.type] || f.type}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        value={leaf.operator}
        onChange={(e) => onChange({ ...leaf, operator: e.target.value as ConditionOperator })}
        className="flex-1 min-w-0 border border-gray-200 rounded-md px-1.5 py-1.5 text-[10px] text-gray-700 bg-white outline-none focus:border-primary-400 cursor-pointer"
      >
        <option value="" disabled>Select...</option>
        {OPERATORS.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>

      {/* Value input */}
      {needsValue && (
        <input
          type="text"
          value={leaf.value ?? ''}
          onChange={(e) => onChange({ ...leaf, value: e.target.value })}
          placeholder="value"
          className="flex-1 min-w-0 border border-gray-200 rounded-md px-1.5 py-1.5 text-[10px] text-gray-700 outline-none focus:border-primary-400 placeholder:text-gray-300"
        />
      )}

      {/* Delete */}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
      >
        <TrashIcon size={13} />
      </button>
    </div>
  )
}

// Group block with header: [badge|spacer] [bordered header + items]
function ConditionGroupBlock({
  group,
  hasSiblings,
  isLast,
  parentLogic,
  onToggleLogic,
  availableFields,
  onChange,
  onRemove,
  depth = 0,
}: {
  group: ConditionGroup
  hasSiblings: boolean
  isLast: boolean
  parentLogic: 'and' | 'or'
  onToggleLogic: () => void
  availableFields: FormField[]
  onChange: (g: ConditionGroup) => void
  onRemove: () => void
  depth?: number
}) {
  const isEmpty = group.items.length === 0

  const addLeaf = () => {
    const newLeaf: ConditionLeaf = {
      type: 'condition',
      fieldId: availableFields[0]?.id ?? '',
      operator: 'equals',
      value: '',
    }
    onChange({ ...group, items: [...group.items, newLeaf] })
  }

  const addSubGroup = () => {
    onChange({ ...group, items: [...group.items, { type: 'group', logic: 'and', items: [] }] })
  }

  return (
    <div className="flex items-start gap-1">
      {/* Badge area */}
      {hasSiblings ? (
        isLast
          ? <div style={{ minWidth: 34 }} className="shrink-0 mt-2" />
          : <div className="mt-2 shrink-0"><LogicBadge logic={parentLogic} onClick={onToggleLogic} /></div>
      ) : null}

      {/* Group container */}
      <div className="flex-1 min-w-0 border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-1.5 px-2.5 py-2 bg-gray-50 border-b border-gray-100">
          <span className="flex-1 text-[10px] italic truncate" style={{ color: isEmpty ? '#9ca3af' : '#6b7280' }}>
            {isEmpty
              ? 'Press the plus to add conditions to group'
              : group.logic === 'and'
                ? 'All of the following are true'
                : 'Any of the following are true'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={addLeaf}
              disabled={availableFields.length === 0}
              className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-40 transition-colors"
            >
              + Condition
            </button>
            {depth < 3 && (
              <button
                type="button"
                onClick={addSubGroup}
                className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                + Group
              </button>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="text-gray-300 hover:text-red-400 transition-colors"
            >
              <TrashIcon size={11} />
            </button>
          </div>
        </div>

        {/* Items */}
        {!isEmpty && (
          <div className="p-2 space-y-1.5">
            <ConditionNodeList
              group={group}
              availableFields={availableFields}
              onChange={onChange}
              depth={depth}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Renders items inside a group (shared between root + nested)
function ConditionNodeList({
  group,
  availableFields,
  onChange,
  depth = 0,
}: {
  group: ConditionGroup
  availableFields: FormField[]
  onChange: (g: ConditionGroup) => void
  depth?: number
}) {
  const toggleLogic = () => onChange({ ...group, logic: group.logic === 'and' ? 'or' : 'and' })
  const hasSiblings = group.items.length > 1

  return (
    <>
      {group.items.map((item, idx) => {
        const isLastItem = idx === group.items.length - 1
        const sharedProps = {
          key: idx,
          hasSiblings,
          isLast: isLastItem,
          parentLogic: group.logic,
          onToggleLogic: toggleLogic,
          availableFields,
          onRemove: () => onChange({ ...group, items: group.items.filter((_, i) => i !== idx) }),
        }

        if (item.type === 'condition') {
          return (
            <ConditionLeafRow
              {...sharedProps}
              leaf={item}
              onChange={(updated) =>
                onChange({ ...group, items: group.items.map((it, i) => (i === idx ? updated : it)) })
              }
            />
          )
        }

        return (
          <ConditionGroupBlock
            {...sharedProps}
            group={item}
            depth={depth + 1}
            onChange={(updated) =>
              onChange({ ...group, items: group.items.map((it, i) => (i === idx ? updated : it)) })
            }
          />
        )
      })}
    </>
  )
}

// ─── Condition Popup (portaled, fixed positioned) ──────────────────────────────

function ConditionPopup({
  tree,
  availableFields,
  onUpdate,
  onClose,
  anchorEl,
}: {
  tree: ConditionGroup
  availableFields: FormField[]
  onUpdate: (t: ConditionGroup) => void
  onClose: () => void
  anchorEl: HTMLElement | null
}) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
  }, [anchorEl])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        anchorEl &&
        !anchorEl.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [anchorEl, onClose])

  if (!pos) return null

  const hasItems = tree.items.length > 0

  const addLeaf = () => {
    if (availableFields.length === 0) return
    const newLeaf: ConditionLeaf = {
      type: 'condition',
      fieldId: availableFields[0].id,
      operator: 'equals',
      value: '',
    }
    onUpdate({ ...tree, items: [...tree.items, newLeaf] })
  }

  const addGroup = () => {
    const newGroup: ConditionGroup = { type: 'group', logic: 'and', items: [] }
    onUpdate({ ...tree, items: [...tree.items, newGroup] })
  }

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[9999] w-[340px] bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-gray-200 flex flex-col overflow-hidden"
      style={{ top: pos.top, right: pos.right }}
    >
      {/* Content */}
      <div className="flex-1 overflow-y-auto max-h-60">
        {!hasItems ? (
          <div className="flex items-center justify-center py-6">
            <span className="text-xs text-gray-400">No conditions specified yet</span>
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            <ConditionNodeList
              group={tree}
              availableFields={availableFields}
              onChange={onUpdate}
              depth={0}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addLeaf}
            disabled={availableFields.length === 0}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-40 transition-colors"
          >
            + Add condition
          </button>
          <button
            type="button"
            onClick={addGroup}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            + Add condition group
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FieldPropertiesPanel({ isOpen, field, sections = [], onChange, onClose }: Props) {
  const [bulkText, setBulkText] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [conditionOpen, setConditionOpen] = useState(false)
  const conditionBtnRef = useRef<HTMLButtonElement>(null)

  // Close popup when selected field changes
  useEffect(() => {
    setConditionOpen(false)
  }, [field?.id])

  if (!isOpen) return null

  // Empty state
  if (!field) {
    return (
      <div className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden h-full">
        <div className="flex items-center justify-end px-4 py-3 border-b border-gray-100">
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon size={14} weight="bold" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-300">
            <path
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-xs text-gray-400 leading-relaxed">
            Click a field in your form to modify it
          </p>
        </div>
      </div>
    )
  }

  const isDisplayOnly = DISPLAY_ONLY.includes(field.type)
  const hasOptions = HAS_OPTIONS.includes(field.type)
  const hasPlaceholder = HAS_PLACEHOLDER.includes(field.type)
  const hasValidation = HAS_VALIDATION.includes(field.type)
  const options = field.options ?? []

  const updateOption = (idx: number, val: string) => {
    const next = [...options]
    next[idx] = val
    onChange({ options: next })
  }

  const removeOption = (idx: number) => {
    onChange({ options: options.filter((_, i) => i !== idx) })
  }

  const addOption = () => {
    onChange({ options: [...options, `Option ${options.length + 1}`] })
  }

  const applyBulk = () => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length > 0) onChange({ options: [...options, ...lines] })
    setBulkText('')
    setShowBulk(false)
  }

  // ─── Condition logic ──────────────────────────────────────────────────────

  // Fields from sections BEFORE the section containing the current field
  const currentSectionIdx = sections.findIndex((s) => s.fields.some((f) => f.id === field.id))
  const availableFields = sections
    .slice(0, Math.max(0, currentSectionIdx))
    .flatMap((s) => s.fields)
    .filter((f) => !NON_ANSWERABLE.includes(f.type))

  const conditionTree: ConditionGroup = field.conditionTree ?? { type: 'group', logic: 'and', items: [] }
  const hasConditions = conditionTree.items.length > 0

  const updateConditionTree = (tree: ConditionGroup) => {
    onChange({ conditionTree: tree.items.length > 0 ? tree : undefined })
  }

  return (
    <div className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <span className="text-sm font-semibold text-gray-900">
          {FIELD_TYPE_LABELS[field.type] ?? 'Field'}
        </span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XIcon size={14} weight="bold" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Basic */}
        <Section label="Basic">
          {/* Banner alert type */}
          {field.type === 'banner_block' && (
            <div>
              <Label>Alert type</Label>
              <div className="flex gap-1">
                {(['info', 'warning', 'error', 'success'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ bannerType: t })}
                    className={`flex-1 py-1 text-[10px] font-semibold rounded-md border transition-colors capitalize ${
                      (field.bannerType ?? 'info') === t
                        ? 'border-primary-400 bg-primary-50 text-primary-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder */}
          {hasPlaceholder && (
            <div>
              <Label>Placeholder</Label>
              <input
                type="text"
                value={field.placeholder ?? ''}
                onChange={(e) => onChange({ placeholder: e.target.value || undefined })}
                placeholder="Enter placeholder..."
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 placeholder:text-gray-400"
              />
            </div>
          )}

          {/* Default value */}
          {HAS_DEFAULT_VALUE.includes(field.type) && (
            <div>
              <Label>Default value</Label>
              <input
                type="text"
                value={field.defaultValue ?? ''}
                onChange={(e) => onChange({ defaultValue: e.target.value || undefined })}
                placeholder="Pre-filled value..."
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 placeholder:text-gray-400"
              />
            </div>
          )}

          {/* Address sub-field placeholders */}
          {field.type === 'address' && (
            <div className="space-y-1.5">
              <Label>Sub-field placeholders</Label>
              {([
                { key: 'street', label: 'Address line' },
                { key: 'city',   label: 'City' },
                { key: 'state',  label: 'State / Province' },
                { key: 'zip',    label: 'ZIP / Postal code' },
              ] as { key: keyof NonNullable<typeof field.addressSubPlaceholders>; label: string }[]).map(({ key, label }) => (
                <input
                  key={key}
                  type="text"
                  placeholder={label}
                  value={field.addressSubPlaceholders?.[key] ?? ''}
                  onChange={(e) => onChange({ addressSubPlaceholders: { ...field.addressSubPlaceholders, [key]: e.target.value || undefined } })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 placeholder:text-gray-400"
                />
              ))}
            </div>
          )}

          {/* Required */}
          {!isDisplayOnly && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Required</span>
              <Toggle checked={field.required} onChange={(v) => onChange({ required: v })} />
            </div>
          )}

          {/* Half width */}
          {!isDisplayOnly && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Half width</span>
              <Toggle
                checked={field.fieldWidth === 'half'}
                onChange={(v) => onChange({ fieldWidth: v ? 'half' : undefined })}
              />
            </div>
          )}
        </Section>

        {/* Options */}
        {hasOptions && (
          <Section label="Options">
            <div className="space-y-1.5">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 min-w-0"
                  />
                  <button
                    onClick={() => removeOption(idx)}
                    className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={addOption}
                className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                <PlusIcon size={12} weight="bold" />
                Add option
              </button>
              <span className="text-gray-300">·</span>
              <button
                onClick={() => setShowBulk((v) => !v)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Bulk add
              </button>
            </div>

            {showBulk && (
              <div className="mt-1 space-y-1.5">
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"One option per line\nOption A\nOption B"}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 resize-none placeholder:text-gray-400"
                />
                <button
                  onClick={applyBulk}
                  className="w-full py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Add options
                </button>
              </div>
            )}
          </Section>
        )}

        {/* Logic */}
        <Section label="Logic" defaultOpen={false}>
          {/* Hide always */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Hide always</span>
            <Toggle
              checked={field.hideAlways ?? false}
              onChange={(v) => onChange({ hideAlways: v || undefined })}
            />
          </div>

          {/* Conditional logic */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-gray-600">Hide conditionally</span>
              <span
                title="Show or hide this field based on answers to earlier questions"
                className="text-gray-400 cursor-help"
              >
                <QuestionIcon size={12} />
              </span>
            </div>

            {/* Show when / Hide when tabs */}
            <div className="flex gap-1">
              {(['show', 'hide'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChange({ conditionMode: mode })}
                  className={`flex-1 py-1 text-xs font-medium rounded-md border transition-colors flex items-center justify-center ${
                    (field.conditionMode ?? 'show') === mode
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {mode === 'show' ? 'Show when' : 'Hide when'}
                </button>
              ))}
            </div>

            {/* Set conditional logic button */}
            <button
              ref={conditionBtnRef}
              type="button"
              onClick={() => setConditionOpen((v) => !v)}
              className={`w-full flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors ${
                hasConditions || conditionOpen
                  ? 'border-primary-300 text-primary-700 bg-primary-50'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M6 3v6m0 0c0 3 3 3 6 3h6M6 9c0 3-3 3-6 0M18 9v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Set conditional logic
              {hasConditions && (
                <span className="ml-auto bg-primary-100 text-primary-700 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                  {countConditionNodes(conditionTree)}
                </span>
              )}
            </button>
          </div>
        </Section>

        {/* Validation */}
        {hasValidation && (
          <Section label="Validation" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Min length</Label>
                <input
                  type="number"
                  value={field.validationMinLength ?? ''}
                  onChange={(e) =>
                    onChange({ validationMinLength: e.target.value ? Number(e.target.value) : undefined })
                  }
                  min={0}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 placeholder:text-gray-400"
                />
              </div>
              <div>
                <Label>Max length</Label>
                <input
                  type="number"
                  value={field.validationMaxLength ?? ''}
                  onChange={(e) =>
                    onChange({ validationMaxLength: e.target.value ? Number(e.target.value) : undefined })
                  }
                  min={0}
                  placeholder="∞"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <Label>Validation pattern</Label>
              <select
                value={field.validationPattern ?? 'none'}
                onChange={(e) =>
                  onChange({ validationPattern: e.target.value === 'none' ? undefined : e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 bg-white"
              >
                {VALIDATION_PATTERNS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label tooltip="Shown to the user when their answer fails validation">
                Error message
              </Label>
              <input
                type="text"
                value={field.validationErrorMessage ?? ''}
                onChange={(e) =>
                  onChange({ validationErrorMessage: e.target.value || undefined })
                }
                placeholder="Please enter a valid value"
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-300 focus:border-primary-400 placeholder:text-gray-400"
              />
            </div>
          </Section>
        )}
      </div>

      {/* Condition popup (portaled) */}
      {conditionOpen && (
        <ConditionPopup
          tree={conditionTree}
          availableFields={availableFields}
          onUpdate={updateConditionTree}
          onClose={() => setConditionOpen(false)}
          anchorEl={conditionBtnRef.current}
        />
      )}
    </div>
  )
}

// Counts how many leaf conditions exist in the tree (for the badge number)
function countConditionNodes(node: ConditionGroup | ConditionNode): number {
  if ('items' in node) {
    return node.items.reduce((sum, child) => sum + countConditionNodes(child), 0)
  }
  return 1
}
