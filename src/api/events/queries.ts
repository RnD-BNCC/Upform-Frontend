import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationOptions } from '@tanstack/react-query'
import { apiClient, publicApiClient } from '@/config/api-client'
import { Api } from '@/constants/api'
import { QUERY_KEYS } from '../queryKeys'
import type { FormEvent } from '@/types/form'
import type {
  EventListResponse,
  EventListParams,
  CreateEventPayload,
  UpdateEventPayload,
} from '@/types/api'

export function useQueryEvents(params: EventListParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENTS, params],
    queryFn: async () => {
      const { data } = await apiClient.get<EventListResponse>(Api.events, { params })
      return data
    },
  })
}

export function useQueryEventDetail(eventId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId],
    queryFn: async () => {
      const { data } = await apiClient.get<FormEvent>(Api.eventDetail(eventId))
      return data
    },
    enabled: !!eventId,
  })
}

export function useMutationCreateEvent(
  options?: UseMutationOptions<FormEvent, Error, CreateEventPayload>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateEventPayload) => {
      const { data } = await apiClient.post<FormEvent>(Api.events, payload)
      return data
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}

export function useMutationUpdateEvent(
  options?: UseMutationOptions<FormEvent, Error, UpdateEventPayload & { eventId: string }>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, ...payload }: UpdateEventPayload & { eventId: string }) => {
      const { data } = await apiClient.patch<FormEvent>(Api.eventDetail(eventId), payload)
      return data
    },
    onSuccess: (_data, variables, ...rest) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, variables.eventId] })
      options?.onSuccess?.(_data, variables, ...rest)
    },
    onError: options?.onError,
  })
}

export function useQueryPublicEvent(eventId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PUBLIC_EVENT, eventId],
    queryFn: async () => {
      const { data } = await publicApiClient.get<FormEvent>(Api.publicEventDetail(eventId))
      return data
    },
    enabled: !!eventId,
    retry: false,
  })
}

export function useMutationDeleteEvent(
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventId: string) => {
      await apiClient.delete(Api.eventDetail(eventId))
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}
