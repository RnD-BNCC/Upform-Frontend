import { useMutationDuplicateEvent } from '@/api/events'

export const useDuplicateEvent = () => {
  const duplicateEvent = useMutationDuplicateEvent({
    onSuccess: (resp) => {
      return resp
    },
    onError: (error) => {
      console.error('Error (useDuplicateEvent):', error)
    },
  })

  return duplicateEvent
}
