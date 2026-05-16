import { useMutationRestoreEvent } from '@/api/events'

export const useRestoreEvent = () => {
  return useMutationRestoreEvent({
    onError: (error) => {
      console.error('Error (useRestoreEvent):', error)
    },
  })
}
