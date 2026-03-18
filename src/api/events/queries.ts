import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/config/api-client'
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

export function useMutationCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateEventPayload) => {
      const { data } = await apiClient.post<FormEvent>(Api.events, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] })
    },
  })
}

export function useMutationUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, ...payload }: UpdateEventPayload & { eventId: string }) => {
      const { data } = await apiClient.patch<FormEvent>(Api.eventDetail(eventId), payload)
      return data
    },
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
    },
  })
}

export function useMutationDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventId: string) => {
      await apiClient.delete(Api.eventDetail(eventId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] })
    },
  })
}
