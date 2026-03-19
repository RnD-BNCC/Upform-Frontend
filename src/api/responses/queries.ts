import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationOptions } from '@tanstack/react-query'
import { apiClient, publicApiClient } from '@/config/api-client'
import { Api } from '@/constants/api'
import { QUERY_KEYS } from '../queryKeys'
import type { FormResponse } from '@/types/form'
import type { SubmitResponsePayload } from '@/types/api'

export function useQueryResponses(eventId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.RESPONSES, eventId],
    queryFn: async () => {
      const { data } = await apiClient.get<FormResponse[]>(Api.responses(eventId))
      return data
    },
    enabled: !!eventId,
  })
}

export function useMutationSubmitResponse(
  eventId: string,
  options?: UseMutationOptions<FormResponse, Error, SubmitResponsePayload>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SubmitResponsePayload) => {
      const { data } = await apiClient.post<FormResponse>(Api.responses(eventId), payload)
      return data
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESPONSES, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}

export function useMutationSubmitPublicResponse(
  eventId: string,
  options?: UseMutationOptions<FormResponse, Error, SubmitResponsePayload>,
) {
  return useMutation({
    mutationFn: async (payload: SubmitResponsePayload) => {
      const { data } = await publicApiClient.post<FormResponse>(Api.publicResponses(eventId), payload)
      return data
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}

export function useMutationDeleteResponse(
  eventId: string,
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (responseId: string) => {
      await apiClient.delete(Api.responseDetail(eventId, responseId))
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESPONSES, eventId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}
