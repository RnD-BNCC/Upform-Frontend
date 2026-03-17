import { FileIcon } from '@phosphor-icons/react'

interface FileResponseListProps {
  values: string[]
}

export default function FileResponseList({ values }: FileResponseListProps) {
  if (values.length === 0) {
    return <p className="text-sm text-gray-400 py-4">No files uploaded</p>
  }

  return (
    <div className="max-h-[280px] overflow-y-auto space-y-1.5 py-2">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-700 border border-gray-100"
        >
          <FileIcon size={16} className="text-gray-400 shrink-0" />
          <span className="truncate">{v}</span>
        </div>
      ))}
    </div>
  )
}
