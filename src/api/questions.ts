import { useQuery } from '@tanstack/react-query'
import { publicApiClient } from '@/config/api-client'
import { Api } from '@/constants/api'
import type { QAQuestion } from '@/types/polling'

export function useQAQuestions(pollId: string | undefined) {
  return useQuery({
    queryKey: ['qa-questions', pollId],
    queryFn: async () => {
      const { data } = await publicApiClient.get<{ questions: QAQuestion[] }>(
        Api.pollQuestions(pollId!),
      )
      return data.questions
    },
    enabled: !!pollId,
    staleTime: 30_000,
  })
}
