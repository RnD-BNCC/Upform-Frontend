import { useMutationSaveBuilderEvent } from '@/api/events'

export const useSaveBuilderEvent = (eventId: string) => {
  const saveBuilderEvent = useMutationSaveBuilderEvent(eventId, {
    onError: (error) => {
      console.error('Error (useSaveBuilderEvent):', error)
    },
  })

  return saveBuilderEvent
}
