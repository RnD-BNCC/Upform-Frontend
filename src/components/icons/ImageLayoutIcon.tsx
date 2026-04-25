import type { ImageLayout } from "@/types/polling";

type Props = {
  layout: ImageLayout;
  active: boolean;
};

export default function ImageLayoutIcon({ layout, active }: Props) {
  const fill = active ? "#0054a5" : "#9CA3AF";
  const textFill = active ? "#6B7280" : "#D1D5DB";

  return (
    <svg width="36" height="24" viewBox="0 0 36 24" fill="none">
      {layout === "above" && (
        <>
          <rect x="8" y="2" width="20" height="10" rx="2" fill={fill} />
          <rect x="4" y="14" width="28" height="2" rx="1" fill={textFill} />
          <rect x="8" y="18" width="20" height="2" rx="1" fill={textFill} />
        </>
      )}
      {layout === "full" && (
        <>
          <rect
            x="2"
            y="2"
            width="32"
            height="20"
            rx="2"
            fill={fill}
            opacity={0.3}
          />
          <rect x="6" y="8" width="24" height="2" rx="1" fill={textFill} />
          <rect x="10" y="12" width="16" height="2" rx="1" fill={textFill} />
        </>
      )}
      {layout === "left" && (
        <>
          <rect x="2" y="4" width="12" height="16" rx="2" fill={fill} />
          <rect x="17" y="6" width="16" height="2" rx="1" fill={textFill} />
          <rect x="17" y="10" width="12" height="2" rx="1" fill={textFill} />
          <rect x="17" y="14" width="14" height="2" rx="1" fill={textFill} />
        </>
      )}
      {layout === "right" && (
        <>
          <rect x="22" y="4" width="12" height="16" rx="2" fill={fill} />
          <rect x="2" y="6" width="16" height="2" rx="1" fill={textFill} />
          <rect x="2" y="10" width="12" height="2" rx="1" fill={textFill} />
          <rect x="2" y="14" width="14" height="2" rx="1" fill={textFill} />
        </>
      )}
      {layout === "left-large" && (
        <>
          <rect x="2" y="2" width="20" height="20" rx="2" fill={fill} />
          <rect x="24" y="6" width="10" height="2" rx="1" fill={textFill} />
          <rect x="24" y="10" width="8" height="2" rx="1" fill={textFill} />
          <rect x="24" y="14" width="10" height="2" rx="1" fill={textFill} />
        </>
      )}
      {layout === "right-large" && (
        <>
          <rect x="14" y="2" width="20" height="20" rx="2" fill={fill} />
          <rect x="2" y="6" width="10" height="2" rx="1" fill={textFill} />
          <rect x="2" y="10" width="8" height="2" rx="1" fill={textFill} />
          <rect x="2" y="14" width="10" height="2" rx="1" fill={textFill} />
        </>
      )}
    </svg>
  );
}
