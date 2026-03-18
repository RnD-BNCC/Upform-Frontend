import { useMutationUpdateEvent } from '@/api/events'

export const useUpdateEvent = () => {
  const updateEvent = useMutationUpdateEvent({
    onSuccess: (resp) => {
      return resp
    },
    onError: (error) => {
      console.error('Error (useUpdateEvent):', error)
    },
  })

  return updateEvent
}
