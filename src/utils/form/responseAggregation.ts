import type { FormResponse } from '@/types/form'
import {
  formatPhoneAnswer,
  isPhoneAnswerEmpty,
  isSerializedPhoneAnswer,
} from './phoneAnswer'

export const PASTEL_COLORS = [
  '#FDE68A',
  '#A7F3D0',
  '#BFDBFE',
  '#C4B5FD',
  '#FBCFE8',
  '#FCA5A5',
  '#FED7AA',
  '#D9F99D',
  '#A5F3FC',
  '#E9D5FF',
]

export const CHART_COLORS = [
  '#4285F4',
  '#EA4335',
  '#FBBC04',
  '#34A853',
  '#FF6D01',
  '#46BDC6',
  '#7B1FA2',
  '#F06292',
  '#0097A7',
  '#795548',
]

export function aggregateChoiceResponses(
  fieldId: string,
  options: string[],
  responses: FormResponse[],
): Array<{ name: string; value: number }> {
  const counts = new Map<string, number>()
  for (const opt of options) counts.set(opt, 0)

  for (const r of responses) {
    const val = r.answers[fieldId]
    if (!val) continue
    const answer = Array.isArray(val) ? val[0] : val
    if (answer && counts.has(answer)) {
      counts.set(answer, counts.get(answer)! + 1)
    } else if (answer) {
      counts.set(answer, (counts.get(answer) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }))
}

export function aggregateCheckboxResponses(
  fieldId: string,
  options: string[],
  responses: FormResponse[],
): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>()
  for (const opt of options) counts.set(opt, 0)

  for (const r of responses) {
    const val = r.answers[fieldId]
    if (!val) continue
    const answers = Array.isArray(val) ? val : [val]
    for (const a of answers) {
      if (counts.has(a)) {
        counts.set(a, counts.get(a)! + 1)
      } else {
        counts.set(a, (counts.get(a) ?? 0) + 1)
      }
    }
  }

  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }))
}

export function aggregateScaleResponses(
  fieldId: string,
  min: number,
  max: number,
  responses: FormResponse[],
): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>()
  for (let i = min; i <= max; i++) counts.set(String(i), 0)

  for (const r of responses) {
    const val = r.answers[fieldId]
    if (!val) continue
    const answer = Array.isArray(val) ? val[0] : val
    if (answer && counts.has(answer)) {
      counts.set(answer, counts.get(answer)! + 1)
    }
  }

  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }))
}

export function collectTextResponses(
  fieldId: string,
  responses: FormResponse[],
): string[] {
  const values: string[] = []
  for (const r of responses) {
    const val = r.answers[fieldId]
    if (!val) continue
    const text = isSerializedPhoneAnswer(val)
      ? formatPhoneAnswer(val)
      : Array.isArray(val)
        ? val.join(', ')
        : val
    if (text.trim()) values.push(text)
  }
  return values
}

export function countFieldResponses(
  fieldId: string,
  responses: FormResponse[],
): number {
  let count = 0
  for (const r of responses) {
    const val = r.answers[fieldId]
    if (isSerializedPhoneAnswer(val)) {
      if (!isPhoneAnswerEmpty(val)) count++
      continue
    }
    if (val && (Array.isArray(val) ? val.length > 0 : val.trim() !== '')) count++
  }
  return count
}
