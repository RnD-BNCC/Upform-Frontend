import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/config/api-client'
import { Api } from '@/constants/api'
import { QUERY_KEYS } from '../queryKeys'
import type { FormSection } from '@/types/form'
import type { CreateSectionPayload, UpdateSectionPayload } from '@/types/api'

export function useQuerySections(eventId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.SECTIONS, eventId],
    queryFn: async () => {
      const { data } = await apiClient.get<FormSection[]>(Api.sections(eventId))
      return data
    },
    enabled: !!eventId,
  })
}

export function useMutationCreateSection(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateSectionPayload) => {
      const { data } = await apiClient.post<FormSection>(Api.sections(eventId), payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECTIONS, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
    },
  })
}

export function useMutationUpdateSection(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sectionId, ...payload }: UpdateSectionPayload & { sectionId: string }) => {
      const { data } = await apiClient.patch<FormSection>(Api.sectionDetail(eventId, sectionId), payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECTIONS, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
    },
  })
}

export function useMutationReorderSections(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (order: string[]) => {
      const { data } = await apiClient.put<FormSection[]>(Api.sectionsReorder(eventId), { order })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECTIONS, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
    },
  })
}

export function useMutationDeleteSection(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sectionId: string) => {
      await apiClient.delete(Api.sectionDetail(eventId, sectionId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECTIONS, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
    },
  })
}
