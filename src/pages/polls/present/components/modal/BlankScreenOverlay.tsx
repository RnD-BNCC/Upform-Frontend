interface BlankScreenOverlayProps {
  onClose: () => void;
}

export default function BlankScreenOverlay({ onClose }: BlankScreenOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-[60] bg-black flex items-center justify-center cursor-pointer"
      onClick={onClose}
    >
      <p className="text-white/20 text-sm">Press B or click to resume</p>
    </div>
  );
}
