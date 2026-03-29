function Spinner({ size = 18, color = "#0054a5" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        fill="none"
        opacity="0.2"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default function LoadingScreen() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
      <p className="text-2xl italic font-semibold text-primary-500">UpForm</p>
      <div className="h-6" />
      <div className="flex items-center gap-2.5">
        <Spinner />
        <p className="text-sm font-bold italic text-gray-800">
          You'll be redirected to your homepage in just a moment...
        </p>
      </div>
    </div>
  );
}
