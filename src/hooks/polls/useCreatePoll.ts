import { useMutationCreatePoll } from '@/api/polls'

export const useCreatePoll = () => {
  return useMutationCreatePoll({
    onError: (error) => {
      console.error('Error (useCreatePoll):', error)
    },
  })
}
