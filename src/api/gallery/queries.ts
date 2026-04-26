import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/config/api-client'
import { Api } from '@/constants/api'

export type GalleryFileEntry = {
  fieldId: string
  fieldLabel: string
  url: string
  filename: string
}

export type GalleryResponse = {
  id: string
  submittedAt: string
  respondentLabel: string
  files: GalleryFileEntry[]
}

export type GalleryEvent = {
  id: string
  name: string
  status: string
  fileCount: number
  responses: GalleryResponse[]
}

type GalleryMeta = {
  page: number
  take: number
  total: number
  totalPages: number
}

export type GalleryFilesData = {
  totalFiles: number
  events: GalleryEvent[]
  meta: GalleryMeta
}

export type GalleryMediaItem = {
  key: string
  url: string
  filename: string
  size: number
  lastModified: string
}

export type GalleryMediaData = {
  items: GalleryMediaItem[]
  meta: GalleryMeta
}

export function useQueryGalleryFiles(page = 1, take = 20) {
  return useQuery({
    queryKey: ['gallery-files', page, take],
    queryFn: async () => {
      const { data } = await apiClient.get<GalleryFilesData>(Api.galleryFiles, {
        params: { page, take },
      })
      return data
    },
  })
}

export function useQueryGalleryMedia(page = 1, take = 21, enabled = true) {
  return useQuery({
    queryKey: ['gallery-media', page, take],
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get<GalleryMediaData>(Api.galleryMedia, {
        params: { page, take },
      })
      return data
    },
  })
}

export function useMutationDeleteFile(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (url: string) => {
      await apiClient.delete(Api.galleryFileDelete, { data: { url } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-files'] })
      queryClient.invalidateQueries({ queryKey: ['gallery-media'] })
      onSuccess?.()
    },
  })
}
