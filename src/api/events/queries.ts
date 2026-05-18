import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationOptions } from '@tanstack/react-query'
import { apiClient, publicApiClient } from '@/config/api-client'
import { Api } from '@/constants/api'
import { QUERY_KEYS } from '../queryKeys'
import type { FormEvent } from '@/types/form'
import type {
  EventQuestionBank,
  EventListResponse,
  EventListParams,
  FormAuditLog,
  SaveBuilderEventPayload,
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

export function useQueryEventDetail(eventId: string, enabled = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId],
    queryFn: async () => {
      const { data } = await apiClient.get<FormEvent>(Api.eventDetail(eventId))
      return data
    },
    enabled: enabled && !!eventId,
    retry: false,
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
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] })
      queryClient.setQueryData([QUERY_KEYS.EVENT_DETAIL, data.id], data)
      options?.onSuccess?.(data, ...args)
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
    onSuccess: (data, variables, ...rest) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] })
      // Immediately update the detail cache so navigating to the detail page
      // shows the correct status without waiting for a background refetch.
      queryClient.setQueryData(
        [QUERY_KEYS.EVENT_DETAIL, variables.eventId],
        (old: FormEvent | undefined) => old ? { ...old, ...data } : old,
      )
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, variables.eventId] })
      options?.onSuccess?.(data, variables, ...rest)
    },
    onError: options?.onError,
  })
}

export function useMutationSaveBuilderEvent(
  eventId: string,
  options?: UseMutationOptions<{ ok: boolean }, Error, SaveBuilderEventPayload>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SaveBuilderEventPayload) => {
      const { data } = await apiClient.patch<{ ok: boolean }>(
        Api.eventBuilder(eventId),
        payload,
      )
      return data
    },
    onSuccess: (data, variables, ...rest) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECTIONS, eventId] })
      options?.onSuccess?.(data, variables, ...rest)
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

export function useMutationRestoreEvent(
  options?: UseMutationOptions<FormEvent, Error, string>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data } = await apiClient.post<FormEvent>(Api.eventRestore(eventId))
      return data
    },
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] })
      queryClient.setQueryData([QUERY_KEYS.EVENT_DETAIL, data.id], data)
      options?.onSuccess?.(data, ...args)
    },
    onError: options?.onError,
  })
}

export function useQueryEventQuestions(eventId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENT_QUESTIONS, eventId],
    queryFn: async () => {
      const { data } = await apiClient.get<EventQuestionBank>(Api.eventQuestions(eventId))
      return data
    },
    enabled: !!eventId,
    retry: false,
  })
}

export function useMutationDuplicateEvent(
  options?: UseMutationOptions<FormEvent, Error, string>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data: duplicatedEvent } = await apiClient.post<FormEvent>(
        Api.eventDuplicate(eventId),
      )
      return duplicatedEvent
    },
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] })
      queryClient.setQueryData([QUERY_KEYS.EVENT_DETAIL, data.id], data)
      options?.onSuccess?.(data, ...args)
    },
    onError: options?.onError,
  })
}

export function useQueryEventAuditLogs(eventId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENT_AUDIT_LOGS, eventId],
    queryFn: async () => {
      const { data } = await apiClient.get<FormAuditLog[]>(
        Api.eventAuditLogs(eventId),
      )
      return data
    },
    enabled: !!eventId,
  })
}

export function useMutationRollbackEventAuditLog(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (logId: string) => {
      const { data } = await apiClient.post<FormEvent>(
        Api.eventAuditLogRollback(eventId, logId),
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_AUDIT_LOGS, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SECTIONS, eventId] })
      queryClient.setQueryData([QUERY_KEYS.EVENT_DETAIL, eventId], data)
    },
  })
}
