import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationOptions } from '@tanstack/react-query'
import { apiClient, publicApiClient } from '@/config/api-client'
import { Api } from '@/constants/api'
import { QUERY_KEYS } from '@/api/queryKeys'
import type {
  Poll,
  PollSlide,
  PollListResponse,
  CreatePollPayload,
  UpdatePollPayload,
  CreateSlidePayload,
  UpdateSlidePayload,
  SlideResults,
} from '@/types/polling'


export function useQueryPolls(page = 1, take = 9, search?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.POLLS, page, take, search],
    queryFn: async () => {
      const { data } = await apiClient.get<PollListResponse>(Api.polls, {
        params: { page, take, search: search || undefined },
      })
      return data
    },
  })
}

export function useQueryPollDetail(pollId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.POLL_DETAIL, pollId],
    queryFn: async () => {
      const { data } = await apiClient.get<Poll>(Api.pollDetail(pollId))
      return data
    },
    enabled: !!pollId,
  })
}

export function useQueryPublicPoll(code: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PUBLIC_POLL, code],
    queryFn: async () => {
      const { data } = await publicApiClient.get<Poll>(Api.publicPollJoin(code))
      return data
    },
    enabled: !!code,
  })
}


export function useMutationCreatePoll(
  options?: UseMutationOptions<Poll, Error, CreatePollPayload>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<Poll>(Api.polls, payload)
      return data
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POLLS] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}

export function useMutationUpdatePoll(
  options?: UseMutationOptions<Poll, Error, { pollId: string } & UpdatePollPayload>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ pollId, ...payload }) => {
      const { data } = await apiClient.patch<Poll>(Api.pollDetail(pollId), payload)
      return data
    },
    onSuccess: (data, variables, ...rest) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POLLS] })
      queryClient.setQueryData([QUERY_KEYS.POLL_DETAIL, variables.pollId], data)
      options?.onSuccess?.(data, variables, ...rest)
    },
    onError: options?.onError,
  })
}

export function useMutationDeletePoll(
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (pollId) => {
      await apiClient.delete(Api.pollDetail(pollId))
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POLLS] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}


export function useMutationCreateSlide(
  pollId: string,
  options?: UseMutationOptions<PollSlide, Error, CreateSlidePayload>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<PollSlide>(Api.pollSlides(pollId), payload)
      return data
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POLL_DETAIL, pollId] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}

export function useMutationUpdateSlide(
  pollId: string,
  options?: UseMutationOptions<PollSlide, Error, { slideId: string } & UpdateSlidePayload>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ slideId, ...payload }) => {
      const { data } = await apiClient.patch<PollSlide>(
        Api.pollSlideDetail(pollId, slideId),
        payload,
      )
      return data
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POLL_DETAIL, pollId] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}

export function useMutationDeleteSlide(
  pollId: string,
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (slideId) => {
      await apiClient.delete(Api.pollSlideDetail(pollId, slideId))
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POLL_DETAIL, pollId] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}

export function useMutationReorderSlides(
  pollId: string,
  options?: UseMutationOptions<PollSlide[], Error, string[]>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (order) => {
      const { data } = await apiClient.put<PollSlide[]>(
        Api.pollSlidesReorder(pollId),
        { order },
      )
      return data
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POLL_DETAIL, pollId] })
      options?.onSuccess?.(...args)
    },
    onError: options?.onError,
  })
}


export function useMutationSubmitVote(
  pollId: string,
  slideId: string,
  options?: UseMutationOptions<{ ok: boolean }, Error, { participantId: string; value: unknown }>,
) {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await publicApiClient.post<{ ok: boolean }>(
        Api.publicPollVote(pollId, slideId),
        payload,
      )
      return data
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}

export { useMutationUploadImage } from '@/api/upload/queries'

export function useQuerySlideResults(pollId: string, slideId: string) {
  return useQuery({
    queryKey: ['slide-results', pollId, slideId],
    queryFn: async () => {
      const { data } = await publicApiClient.get<SlideResults>(
        Api.publicPollResults(pollId, slideId),
      )
      return data
    },
    enabled: !!pollId && !!slideId,
  })
}
