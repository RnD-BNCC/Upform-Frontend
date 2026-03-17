import type { FormResponse } from '@/types/form'

export const CHART_COLORS = [
  '#4285F4', // blue
  '#EA4335', // red
  '#FBBC04', // yellow
  '#34A853', // green
  '#FF6D01', // orange
  '#46BDC6', // teal
  '#7B1FA2', // purple
  '#F06292', // pink
  '#0097A7', // cyan
  '#795548', // brown
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
    const text = Array.isArray(val) ? val.join(', ') : val
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
    if (val && (Array.isArray(val) ? val.length > 0 : val.trim() !== '')) count++
  }
  return count
}
