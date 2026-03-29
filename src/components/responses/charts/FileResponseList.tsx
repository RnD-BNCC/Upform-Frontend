import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FileIcon, DownloadSimpleIcon, ArrowSquareOutIcon } from '@phosphor-icons/react'
import FilePreviewModal from '../FilePreviewModal'

interface FileResponseListProps {
  values: string[]
}

async function downloadFile(url: string, name: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.error("[downloadFile]:", err)
    window.open(url, '_blank')
  }
}

function parseFileValue(v: string): { name: string; url: string } {
  const sep = v.indexOf('::')
  if (sep === -1) return { name: v, url: '' }
  return { name: v.slice(0, sep), url: v.slice(sep + 2) }
}

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.heic', '.heif']
const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv']

function isPreviewable(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0]
  return [...IMAGE_EXTS, ...VIDEO_EXTS].some((ext) => lower.endsWith(ext))
}

function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0]
  return IMAGE_EXTS.some((ext) => lower.endsWith(ext))
}

export default function FileResponseList({ values }: FileResponseListProps) {
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)

  if (values.length === 0) {
    return <p className="text-sm text-gray-400 py-4">No files uploaded</p>
  }

  return (
    <div className="space-y-2 py-2">
      {values.map((v, i) => {
        const { name, url } = parseFileValue(v)
        const isImage = url && isImageUrl(url)
        const canPreview = url && isPreviewable(url)

        return (
          <div
            key={i}
            className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden"
          >
            {isImage && (
              <button
                onClick={() => setPreview({ url, name })}
                className="block w-full cursor-pointer"
              >
                <img
                  src={url}
                  alt={name}
                  className="w-full max-h-40 object-cover hover:opacity-90 transition-opacity"
                />
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700">
              <FileIcon size={16} className="text-gray-400 shrink-0" />
              {canPreview ? (
                <button
                  onClick={() => setPreview({ url, name })}
                  className="truncate flex-1 text-primary-600 hover:underline text-left cursor-pointer"
                >
                  {name}
                </button>
              ) : url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate flex-1 text-primary-600 hover:underline"
                >
                  {name}
                </a>
              ) : (
                <span className="truncate flex-1">{name}</span>
              )}
              {url && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Open"
                  >
                    <ArrowSquareOutIcon size={16} />
                  </a>
                  <button
                    onClick={() => downloadFile(url, name)}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    title="Download"
                  >
                    <DownloadSimpleIcon size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      <AnimatePresence>
        {preview && (
          <FilePreviewModal
            url={preview.url}
            name={preview.name}
            onClose={() => setPreview(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
