import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationOptions } from '@tanstack/react-query'
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

export function useMutationCreateSection(
  eventId: string,
  options?: UseMutationOptions<FormSection, Error, CreateSectionPayload>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateSectionPayload) => {
      const { data } = await apiClient.post<FormSection>(Api.sections(eventId), payload)
      return data
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECTIONS, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}

export function useMutationUpdateSection(
  eventId: string,
  options?: UseMutationOptions<FormSection, Error, UpdateSectionPayload & { sectionId: string }>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sectionId, ...payload }: UpdateSectionPayload & { sectionId: string }) => {
      const { data } = await apiClient.patch<FormSection>(Api.sectionDetail(eventId, sectionId), payload)
      return data
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECTIONS, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}

export function useMutationReorderSections(
  eventId: string,
  options?: UseMutationOptions<FormSection[], Error, string[]>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (order: string[]) => {
      const { data } = await apiClient.put<FormSection[]>(Api.sectionsReorder(eventId), { order })
      return data
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECTIONS, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}

export function useMutationDeleteSection(
  eventId: string,
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sectionId: string) => {
      await apiClient.delete(Api.sectionDetail(eventId, sectionId))
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECTIONS, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}
