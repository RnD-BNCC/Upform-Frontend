import { useMutationDeletePoll } from '@/api/polls'

export const useDeletePoll = () => {
  return useMutationDeletePoll({
    onError: (error) => {
      console.error('Error (useDeletePoll):', error)
    },
  })
}
