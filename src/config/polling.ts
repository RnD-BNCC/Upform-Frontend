import {
  ChatTeardropText,
  ListBullets,
  TextAa,
  SortAscending,
  ChartBar,
  Question,
  NumberCircleOne,
  Coins,
  GridFour,
  MapPin,
} from '@phosphor-icons/react'
import type { SlideType, ImageLayout } from '@/types/polling'

// ── Slide Types ──────────────────────────────────────────────

export const SLIDE_TYPES: { value: SlideType; label: string; icon: React.ReactNode }[] = [
  { value: 'word_cloud', label: 'Word Cloud', icon: ChatTeardropText({ size: 14, weight: 'bold' }) },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: ListBullets({ size: 14, weight: 'bold' }) },
  { value: 'open_ended', label: 'Open Ended', icon: TextAa({ size: 14, weight: 'bold' }) },
  { value: 'ranking', label: 'Ranking', icon: SortAscending({ size: 14, weight: 'bold' }) },
  { value: 'scales', label: 'Scales', icon: ChartBar({ size: 14, weight: 'bold' }) },
  { value: 'qa', label: 'Q&A', icon: Question({ size: 14, weight: 'bold' }) },
  { value: 'guess_number', label: 'Guess Number', icon: NumberCircleOne({ size: 14, weight: 'bold' }) },
  { value: 'hundred_points', label: '100 Points', icon: Coins({ size: 14, weight: 'bold' }) },
  { value: 'grid_2x2', label: '2x2 Grid', icon: GridFour({ size: 14, weight: 'bold' }) },
  { value: 'pin_on_image', label: 'Pin on Image', icon: MapPin({ size: 14, weight: 'bold' }) },
]

export const TYPE_ICONS: Record<SlideType, React.ReactNode> = {
  word_cloud: ChatTeardropText({ size: 12, weight: 'bold' }),
  multiple_choice: ListBullets({ size: 12, weight: 'bold' }),
  open_ended: TextAa({ size: 12, weight: 'bold' }),
  ranking: SortAscending({ size: 12, weight: 'bold' }),
  scales: ChartBar({ size: 12, weight: 'bold' }),
  qa: Question({ size: 12, weight: 'bold' }),
  guess_number: NumberCircleOne({ size: 12, weight: 'bold' }),
  hundred_points: Coins({ size: 12, weight: 'bold' }),
  grid_2x2: GridFour({ size: 12, weight: 'bold' }),
  pin_on_image: MapPin({ size: 12, weight: 'bold' }),
}

// ── Theme & Color Presets ────────────────────────────────────

export type ThemePreset = {
  id: string
  name: string
  bgColor: string
  textColor: string
  barColors: string[]
}

export const COLOR_PRESETS = [
  '#374151', '#6B7280', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#FFFFFF',
]

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'upform-dark', name: 'UpForm Dark', bgColor: '#0a1628', textColor: '#FFFFFF', barColors: ['#3B82F6', '#60A5FA', '#93C5FD'] },
  { id: 'upform-light', name: 'UpForm Light', bgColor: '#FFFFFF', textColor: '#111827', barColors: ['#0054a5', '#3B82F6', '#93C5FD'] },
  { id: 'ocean', name: 'Ocean', bgColor: '#0F172A', textColor: '#E0F2FE', barColors: ['#06B6D4', '#22D3EE', '#67E8F9'] },
  { id: 'sunset', name: 'Sunset', bgColor: '#1C1917', textColor: '#FEF3C7', barColors: ['#F97316', '#FB923C', '#FDBA74'] },
  { id: 'forest', name: 'Forest', bgColor: '#14532D', textColor: '#DCFCE7', barColors: ['#22C55E', '#4ADE80', '#86EFAC'] },
  { id: 'lavender', name: 'Lavender', bgColor: '#2E1065', textColor: '#F3E8FF', barColors: ['#A855F7', '#C084FC', '#D8B4FE'] },
  { id: 'midnight', name: 'Midnight', bgColor: '#0F172A', textColor: '#F8FAFC', barColors: ['#6366F1', '#818CF8', '#A5B4FC'] },
  { id: 'minimal', name: 'Minimal', bgColor: '#F9FAFB', textColor: '#374151', barColors: ['#6B7280', '#9CA3AF', '#D1D5DB'] },
]

// ── Image Layouts ────────────────────────────────────────────

export const IMAGE_LAYOUTS: { value: ImageLayout; label: string }[] = [
  { value: 'above', label: 'Above' },
  { value: 'full', label: 'Full BG' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'left-large', label: 'Left Lg' },
  { value: 'right-large', label: 'Right Lg' },
]

// ── Visualization Colors ─────────────────────────────────────

export const SCALE_COLORS = ['#3B82F6', '#EF4444', '#1E3A5F', '#F97316', '#22C55E', '#8B5CF6', '#EC4899', '#06B6D4', '#EAB308', '#6366F1']

export const BAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-pink-500',
]

export const WORD_CLOUD_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
  '#14b8a6', '#84cc16', '#d946ef', '#eab308',
]

export const OPEN_ENDED_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
  '#14b8a6', '#84cc16', '#d946ef', '#eab308',
]

export const DOT_COLORS = ['#3B82F6', '#EF4444', '#22C55E', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4', '#EAB308']

export const PIN_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4', '#EAB308']

// ── Toolbar (SlidePreview) ───────────────────────────────────

export const TOOLBAR_COLORS = [
  '#111827', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#FFFFFF',
]

export const FORMAT_CMDS = ['bold', 'italic', 'underline', 'strikethrough'] as const

// ── Leaderboard ──────────────────────────────────────────────

export const RANK_COLORS = [
  'from-amber-400 to-yellow-500',
  'from-gray-300 to-gray-400',
  'from-amber-600 to-amber-700',
  'from-primary-400 to-primary-500',
  'from-primary-300 to-primary-400',
]

export const LEADERBOARD_BAR_BG = [
  'bg-amber-400/20',
  'bg-gray-300/20',
  'bg-amber-600/20',
  'bg-primary-400/15',
  'bg-primary-300/15',
]

// ── Grid Preview Positions ───────────────────────────────────

export const GRID_DOT_POSITIONS = [
  { x: 70, y: 30 },
  { x: 30, y: 70 },
  { x: 65, y: 65 },
  { x: 35, y: 35 },
]
