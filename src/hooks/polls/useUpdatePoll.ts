import { useMutationUpdatePoll } from '@/api/polls'

export const useUpdatePoll = () => {
  return useMutationUpdatePoll({
    onError: (error) => {
      console.error('Error (useUpdatePoll):', error)
    },
  })
}
