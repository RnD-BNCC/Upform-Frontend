export default function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${checked ? 'bg-primary-500' : 'bg-gray-300'}`}
      style={{ width: 44, height: 24 }}
    >
      <span
        className="absolute rounded-full bg-white shadow transition-transform duration-200"
        style={{ width: 20, height: 20, top: 2, left: 2, transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}
