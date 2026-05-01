import { motion } from "framer-motion";

type Props = {
  svgWidth: number;
  svgHeight: number;
  fillPath: string;
  strokePath: string;
  color: string;
  className?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  animated?: boolean;
  animationDelay?: number;
};

export default function ScaleWaveSvg({
  svgWidth,
  svgHeight,
  fillPath,
  strokePath,
  color,
  className,
  fillOpacity = 0.18,
  strokeWidth = 1.5,
  animated = false,
  animationDelay = 0,
}: Props) {
  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      preserveAspectRatio="none"
      className={className}
    >
      {animated ? (
        <>
          <motion.path
            d={fillPath}
            fill={color}
            fillOpacity={fillOpacity}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: animationDelay }}
          />
          <motion.path
            d={strokePath}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: animationDelay }}
          />
        </>
      ) : (
        <>
          <path d={fillPath} fill={color} fillOpacity={fillOpacity} />
          <path
            d={strokePath}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
