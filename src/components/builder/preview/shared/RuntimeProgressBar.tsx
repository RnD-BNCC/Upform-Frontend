import type { ThemeConfig } from "@/utils/form/themeConfig";

type Props = {
  value: number;
  themeConfig: ThemeConfig;
};

export default function RuntimeProgressBar({ value, themeConfig }: Props) {
  const progress = Math.min(100, Math.max(0, value));

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-2"
      style={{ background: themeConfig.inputBorder }}
    >
      <div
        className="h-full transition-[width] duration-300 ease-out"
        style={{
          background: themeConfig.btnBg,
          width: `${progress}%`,
        }}
      />
    </div>
  );
}
