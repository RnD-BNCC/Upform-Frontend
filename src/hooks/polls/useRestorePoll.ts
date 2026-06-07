import { useMutationRestorePoll } from '@/api/polls'

export const useRestorePoll = () => {
  return useMutationRestorePoll({
    onError: (error) => {
      console.error('Error (useRestorePoll):', error)
    },
  })
}
