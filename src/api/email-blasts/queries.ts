import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationOptions } from '@tanstack/react-query'
import { apiClient } from '@/config/api-client'
import { Api } from '@/constants/api'
import { QUERY_KEYS } from '../queryKeys'
import type {
  EmailBlast,
  EmailBlastDetail,
  EmailBlastListResponse,
  CreateEmailBlastPayload,
  EmailComposerDraft,
  SaveEmailComposerDraftPayload,
} from '@/types/api'

export function useQueryEmailBlasts(page = 1, take = 20, eventId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.EMAIL_BLASTS, page, take, eventId ?? 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<EmailBlastListResponse>(Api.emailBlasts, {
        params: { page, take, ...(eventId ? { eventId } : {}) },
      })
      return data
    },
  })
}

export function useQueryEmailBlastDetail(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.EMAIL_BLAST_DETAIL, id],
    queryFn: async () => {
      const { data } = await apiClient.get<EmailBlastDetail>(Api.emailBlastDetail(id))
      return data
    },
    enabled: !!id,
  })
}

export function useMutationCreateEmailBlast(
  options?: UseMutationOptions<EmailBlast, Error, CreateEmailBlastPayload>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateEmailBlastPayload) => {
      const { data } = await apiClient.post<EmailBlast>(Api.emailBlasts, payload)
      return data
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMAIL_BLASTS] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}

export function useQueryEmailComposerDraft(eventId: string, enabled = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.EMAIL_BLAST_DRAFT, eventId],
    queryFn: async () => {
      const { data } = await apiClient.get<EmailComposerDraft | null>(
        Api.emailBlastDraft(eventId),
      )
      return data
    },
    enabled: enabled && !!eventId,
  })
}

export function useMutationSaveEmailComposerDraft(
  options?: UseMutationOptions<
    EmailComposerDraft,
    Error,
    SaveEmailComposerDraftPayload
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, ...payload }: SaveEmailComposerDraftPayload) => {
      const { data } = await apiClient.put<EmailComposerDraft>(
        Api.emailBlastDraft(eventId),
        payload,
      )
      return data
    },
    onSuccess: (...args) => {
      const [data, variables] = args
      queryClient.setQueryData(
        [QUERY_KEYS.EMAIL_BLAST_DRAFT, variables.eventId],
        data,
      )
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}

export function useMutationCancelEmailBlast(
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(Api.emailBlastDetail(id))
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMAIL_BLASTS] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}
