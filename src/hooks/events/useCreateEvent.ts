import { useMutationCreateEvent } from '@/api/events'

export const useCreateEvent = () => {
  const createEvent = useMutationCreateEvent({
    onSuccess: (resp) => {
      return resp
    },
    onError: (error) => {
      console.error('Error (useCreateEvent):', error)
    },
  })

  return createEvent
}
