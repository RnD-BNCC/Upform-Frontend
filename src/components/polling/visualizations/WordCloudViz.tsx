import { useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import cloud from 'd3-cloud'
import type { WordCloudResult } from '@/types/polling'
import { WORD_CLOUD_COLORS as COLORS } from '@/config/polling'

interface LayoutWord {
  text: string
  size: number
  x: number
  y: number
  rotate: number
  color: string
}

interface CloudInput extends cloud.Word {
  color: string
}

export default function WordCloudViz({
  data,
  correctAnswers,
}: {
  data: WordCloudResult
  correctAnswers?: string[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [words, setWords] = useState<LayoutWord[]>([])

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
    if (minDim < 300) return { min: 14, max: 48 }
    if (minDim < 500) return { min: 16, max: 64 }
    return { min: 18, max: 80 }
  }, [dimensions])

  useEffect(() => {
    const { width, height } = dimensions
    if (!data?.length || width <= 0 || height <= 0) {
      setWords([])
      return
    }

    const valid = data.filter((d) => d.word && d.count > 0)
    if (!valid.length) { setWords([]); return }

    let cancelled = false

    const maxCount = Math.max(...valid.map((d) => d.count), 1)
    const sorted = [...valid].sort((a, b) => b.count - a.count)

    const input: CloudInput[] = sorted.map((item, idx) => ({
      text: item.word,
      size: fontRange.min + (item.count / maxCount) * (fontRange.max - fontRange.min),
      color: COLORS[idx % COLORS.length],
    }))

    // Debug: test if canvas can actually render Montserrat
    document.fonts.load('800 20px Montserrat').then((fonts) => {
      if (cancelled) return

      // Check if font actually loaded
      const fontLoaded = document.fonts.check('800 20px Montserrat')
      console.log('[WordCloud] fonts.load resolved, count:', fonts.length, 'check:', fontLoaded)

      // Test canvas text measurement
      const testCanvas = document.createElement('canvas')
      const ctx = testCanvas.getContext('2d')!
      ctx.font = '800 40px Montserrat'
      const testWidth = ctx.measureText('test').width
      ctx.font = '800 40px sans-serif'
      const fallbackWidth = ctx.measureText('test').width
      console.log('[WordCloud] canvas measure — Montserrat:', testWidth, 'sans-serif:', fallbackWidth, 'same?', testWidth === fallbackWidth)

      console.log(`[WordCloud] input words: ${input.length}, container: ${width}x${height}`)
      console.log('[WordCloud] input sizes:', input.map(w => `${w.text}=${Math.round(w.size!)}`).join(', '))

      cloud<CloudInput>()
        .size([width, height])
        .words(input)
        .padding(6)
        .rotate(() => (Math.random() > 0.5 ? 0 : 90))
        .font('Montserrat')
        .fontWeight('800')
        .fontSize((d) => d.size!)
        .spiral('archimedean')
        .on('end', (output) => {
          if (cancelled) return
          console.log(`[WordCloud] placed ${output.length}/${input.length}:`)
          output.forEach(w => console.log(`  "${w.text}" x=${w.x} y=${w.y} rot=${w.rotate} size=${w.size} w=${(w as any).width} h=${(w as any).height}`))
          setWords(
            output.map((w) => ({
              text: w.text!,
              size: w.size!,
              x: w.x!,
              y: w.y!,
              rotate: w.rotate!,
              color: w.color,
            })),
          )
        })
        .start()
    })

    return () => { cancelled = true }
  }, [data, dimensions, fontRange])

  const isRevealing = !!correctAnswers?.length
  const normalizedCorrect = useMemo(
    () => correctAnswers?.map((a) => a.trim().toLowerCase()) ?? [],
    [correctAnswers],
  )

  const { width, height } = dimensions

  return (
    <div ref={containerRef} className="w-full h-full min-h-[250px] max-h-[70vh]">
      {!data || data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-white/40 text-lg">
          Waiting for responses...
        </div>
      ) : width > 0 && height > 0 ? (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <g transform={`translate(${width / 2},${height / 2})`}>
            <AnimatePresence>
              {words.map((w) => {
                const isCorrect = isRevealing && normalizedCorrect.includes(w.text.trim().toLowerCase())
                const fillColor = isCorrect ? '#10b981' : w.color
                const opacity = isRevealing && !isCorrect ? 0.3 : 1

                return (
                  <motion.g
                    key={w.text}
                    initial={{ opacity: 0 }}
                    animate={{ opacity }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`translate(${w.x},${w.y}) rotate(${w.rotate})`}
                      style={{
                        fontSize: w.size,
                        fill: fillColor,
                        fontFamily: 'Montserrat, sans-serif',
                        fontWeight: 800,
                      }}
                      className="select-none"
                    >
                      {w.text}
                    </text>
                  </motion.g>
                )
              })}
            </AnimatePresence>
          </g>
        </svg>
      ) : null}
    </div>
  )
}
