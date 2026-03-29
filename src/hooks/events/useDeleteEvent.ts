import { useMutationDeleteEvent } from '@/api/events'

export const useDeleteEvent = () => {
  const deleteEvent = useMutationDeleteEvent({
    onSuccess: (resp) => {
      return resp
    },
    onError: (error) => {
      console.error('Error (useDeleteEvent):', error)
    },
  })

  return deleteEvent
}
