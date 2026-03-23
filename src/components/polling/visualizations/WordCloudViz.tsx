import { useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { WordCloudResult } from '@/types/polling'
import { WORD_CLOUD_COLORS as COLORS } from '@/config/polling'

/** Average char-width ratio for bold sans-serif (Montserrat 800) */
const CHAR_W = 0.62
const LINE_H = 1.25

interface PlacedWord {
  text: string
  count: number
  fontSize: number
  x: number
  y: number
  rotate: boolean
  color: string
  w: number
  h: number
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
  pad: number,
) {
  return !(
    ax - aw / 2 - pad > bx + bw / 2 ||
    ax + aw / 2 + pad < bx - bw / 2 ||
    ay - ah / 2 - pad > by + bh / 2 ||
    ay + ah / 2 + pad < by - bh / 2
  )
}

function computeLayout(
  data: WordCloudResult,
  width: number,
  height: number,
  fontMin: number,
  fontMax: number,
): PlacedWord[] {
  if (!data.length || width <= 0 || height <= 0) return []

  const valid = data.filter((d) => d.word && d.count > 0)
  if (!valid.length) return []

  const maxCount = Math.max(...valid.map((d) => d.count), 1)
  const sorted = [...valid].sort((a, b) => b.count - a.count)

  const words: PlacedWord[] = []
  const halfW = width / 2
  const halfH = height / 2

  // Seeded "random" based on word text for deterministic rotation
  const hash = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
    return h
  }

  for (let idx = 0; idx < sorted.length; idx++) {
    const item = sorted[idx]
    const ratio = item.count / maxCount
    const fontSize = fontMin + ratio * (fontMax - fontMin)
    const rotate = idx > 0 && Math.abs(hash(item.word)) % 100 < 30
    const textW = item.word.length * fontSize * CHAR_W
    const textH = fontSize * LINE_H
    const w = rotate ? textH : textW
    const h = rotate ? textW : textH
    const color = COLORS[idx % COLORS.length]

    let placed = false
    // Archimedean spiral
    const step = 2
    const angleStep = 0.35
    const maxR = Math.max(halfW, halfH) * 1.5

    for (let r = 0; r < maxR && !placed; r += step) {
      const angles = r === 0 ? [0] : Array.from({ length: Math.ceil((2 * Math.PI) / angleStep) }, (_, i) => i * angleStep)
      for (const angle of angles) {
        const cx = r * Math.cos(angle)
        const cy = r * Math.sin(angle)

        // Check bounds
        if (
          cx - w / 2 < -halfW + 4 || cx + w / 2 > halfW - 4 ||
          cy - h / 2 < -halfH + 4 || cy + h / 2 > halfH - 4
        ) continue

        // Check overlap with placed words
        let overlap = false
        for (const pw of words) {
          if (rectsOverlap(cx, cy, w, h, pw.x, pw.y, pw.w, pw.h, 6)) {
            overlap = true
            break
          }
        }

        if (!overlap) {
          words.push({ text: item.word, count: item.count, fontSize, x: cx, y: cy, rotate, color, w, h })
          placed = true
          break
        }
      }
    }

    // Fallback: place outside view area (won't be visible but avoids crash)
    if (!placed) {
      words.push({ text: item.word, count: item.count, fontSize, x: halfW * 2, y: halfH * 2, rotate, color, w, h })
    }
  }

  return words
}

export default function WordCloudViz({ data }: { data: WordCloudResult }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setDimensions({ width, height })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const fontRange = useMemo(() => {
    const minDim = Math.min(dimensions.width, dimensions.height)
    if (minDim < 300) return { min: 12, max: 36 }
    if (minDim < 500) return { min: 14, max: 52 }
    return { min: 16, max: 72 }
  }, [dimensions])

  const words = useMemo(
    () => computeLayout(data ?? [], dimensions.width, dimensions.height, fontRange.min, fontRange.max),
    [data, dimensions.width, dimensions.height, fontRange],
  )

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 text-lg">
        Waiting for responses...
      </div>
    )
  }

  const { width, height } = dimensions

  return (
    <div ref={containerRef} className="w-full h-full min-h-[250px] max-h-[70vh]">
      {width > 0 && height > 0 && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <g transform={`translate(${width / 2},${height / 2})`}>
            <AnimatePresence>
              {words.map((w) => (
                <motion.text
                  key={w.text}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                  textAnchor="middle"
                  dominantBaseline="central"
                  x={w.x}
                  y={w.y}
                  transform={w.rotate ? `translate(${w.x},${w.y}) rotate(90)` : undefined}
                  style={{
                    fontSize: w.fontSize,
                    fill: w.color,
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 800,
                  }}
                  className="select-none"
                >
                  {w.text}
                </motion.text>
              ))}
            </AnimatePresence>
          </g>
        </svg>
      )}
    </div>
  )
}
