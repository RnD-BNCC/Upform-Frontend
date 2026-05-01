import { useRef } from 'react'
import { useMutationUploadImage } from '@/api/polls'
import { Image as ImageIcon, PencilSimple, Trash } from '@phosphor-icons/react';
import { Spinner } from "@/components/ui";

export default function ImageUpload({
  imageUrl,
  onUpload,
  onRemove,
}: {
  imageUrl?: string
  onUpload: (url: string) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useMutationUploadImage()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadMutation.mutate(file, {
      onSuccess: (data) => onUpload(data.url),
    })
    e.target.value = ''
  }

  if (imageUrl) {
    return (
      <div className="flex flex-col gap-2">
        <div className="relative overflow-hidden rounded-sm border border-gray-200">
          <img src={imageUrl} alt="" className="w-full h-28 object-cover" />
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            <PencilSimple size={12} weight="bold" />
            Update image
          </button>
          <button
            onClick={onRemove}
            className="flex cursor-pointer items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-500"
          >
            <Trash size={12} weight="bold" />
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-sm border border-dashed border-gray-200 bg-white p-4 text-center transition-colors hover:border-gray-300"
      >
        {uploadMutation.isPending ? (
          <Spinner size={24} className="text-primary-400 mx-auto mb-1.5" />
        ) : (
          <ImageIcon size={24} className="text-gray-300 mx-auto mb-1.5" />
        )}
        <p className="text-xs text-gray-400">
          {uploadMutation.isPending ? 'Uploading...' : (
            <>Drag and drop or <span className="text-primary-500 font-medium">click to add an image</span></>
          )}
        </p>
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">We support png, gif, jpg, jpeg, svg, webp, avif and heif.</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
