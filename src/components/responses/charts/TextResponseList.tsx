interface TextResponseListProps {
  values: string[]
}

export default function TextResponseList({ values }: TextResponseListProps) {
  if (values.length === 0) {
    return <p className="text-sm text-gray-400 py-4">No responses</p>
  }

  return (
    <div className="max-h-[280px] overflow-y-auto space-y-1.5 py-2">
      {values.map((v, i) => (
        <div
          key={i}
          className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-700 border border-gray-100"
        >
          {v}
        </div>
      ))}
    </div>
  )
}
