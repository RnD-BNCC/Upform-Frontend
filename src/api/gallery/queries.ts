import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, publicApiClient } from '@/config/api-client'
import { Api } from '@/constants/api'
import type {
  GalleryDriveConnection,
  GalleryFilesData,
  GalleryMediaData,
  GalleryShare,
  GallerySharedFilesData,
  UpdateGallerySharePayload,
} from '@/types/gallery'

function buildLocalShareUrl(token: string, fallback: string) {
  if (!token) return fallback
  if (typeof window === 'undefined') return fallback
  return `${window.location.origin}/gallery/share/${token}`
}

function normalizeShareUrl<T extends {
  shareUrl: string
  token: string
  driveConnections?: GalleryDriveConnection[]
}>(share: T): T & { driveConnections: GalleryDriveConnection[] } {
  return {
    ...share,
    shareUrl: buildLocalShareUrl(share.token, share.shareUrl),
    driveConnections: share.driveConnections ?? [],
  }
}

function normalizeGalleryFilesData(data: GalleryFilesData): GalleryFilesData {
  return {
    ...data,
    events: data.events.map((event) => ({
      ...event,
      share: event.share ? normalizeShareUrl(event.share) : null,
    })),
  }
}

function normalizeSharedGalleryData(data: GallerySharedFilesData): GallerySharedFilesData {
  return {
    ...data,
    event: data.event
      ? {
          ...data.event,
          share: data.event.share ? normalizeShareUrl(data.event.share) : null,
        }
      : null,
  }
}

export function useQueryGalleryFiles(page = 1, take = 20) {
  return useQuery({
    queryKey: ['gallery-files', page, take],
    queryFn: async () => {
      const { data } = await apiClient.get<GalleryFilesData>(Api.galleryFiles, {
        params: { page, take },
      })
      return normalizeGalleryFilesData(data)
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

export function useQueryGalleryShare(eventId: string, enabled = true) {
  return useQuery({
    queryKey: ['gallery-share', eventId],
    enabled: enabled && !!eventId,
    queryFn: async () => {
      const { data } = await apiClient.get<GalleryShare>(Api.galleryEventShare(eventId))
      return normalizeShareUrl(data)
    },
  })
}

export function useQuerySharedGallery(
  token: string,
  authenticated: boolean,
  enabled = true,
) {
  return useQuery({
    queryKey: ['gallery-shared', token, authenticated],
    enabled: enabled && !!token,
    retry: false,
    queryFn: async () => {
      const client = authenticated ? apiClient : publicApiClient
      const { data } = await client.get<GallerySharedFilesData>(Api.galleryShare(token))
      return normalizeSharedGalleryData(data)
    },
  })
}

export function useMutationUpdateGalleryShare(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateGallerySharePayload) => {
      const { data } = await apiClient.patch<GalleryShare>(
        Api.galleryEventShare(eventId),
        payload,
      )
      return normalizeShareUrl(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-share', eventId] })
      queryClient.invalidateQueries({ queryKey: ['gallery-files'] })
    },
  })
}

export function useMutationConnectGalleryDrive(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<GalleryShare>(
        Api.galleryEventShareDrive(eventId),
      )
      return normalizeShareUrl(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-share', eventId] })
      queryClient.invalidateQueries({ queryKey: ['gallery-files'] })
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
