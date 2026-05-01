import { AnimatePresence, motion } from "framer-motion";

export type WordCloudSvgWord = {
  text: string;
  x: number;
  y: number;
  size: number;
  rotate: number;
  color: string;
};

type Props = {
  width: number;
  height: number;
  words: WordCloudSvgWord[];
  className?: string;
  animated?: boolean;
  isRevealing?: boolean;
  normalizedCorrect?: string[];
  opacity?: number;
};

export default function WordCloudSvg({
  width,
  height,
  words,
  className,
  animated = false,
  isRevealing = false,
  normalizedCorrect = [],
  opacity = 1,
}: Props) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      <g transform={`translate(${width / 2},${height / 2})`}>
        {animated ? (
          <AnimatePresence>
            {words.map((word) => {
              const isCorrect =
                isRevealing &&
                normalizedCorrect.includes(word.text.trim().toLowerCase());
              const fillColor = isCorrect ? "#10b981" : word.color;
              const nextOpacity = isRevealing && !isCorrect ? 0.3 : 1;

              return (
                <motion.g
                  key={word.text}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: nextOpacity }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`translate(${word.x},${word.y}) rotate(${word.rotate})`}
                    style={{
                      fontSize: word.size,
                      fill: fillColor,
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 800,
                    }}
                    className="select-none"
                  >
                    {word.text}
                  </text>
                </motion.g>
              );
            })}
          </AnimatePresence>
        ) : (
          words.map((word) => (
            <text
              key={word.text}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`translate(${word.x},${word.y}) rotate(${word.rotate})`}
              style={{
                fontSize: word.size,
                fill: word.color,
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 800,
                opacity,
              }}
              className="select-none"
            >
              {word.text}
            </text>
          ))
        )}
      </g>
    </svg>
  );
}
