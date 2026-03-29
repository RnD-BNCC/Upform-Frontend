import { useMutationReorderSections } from '@/api/sections'

export const useReorderSections = (eventId: string) => {
  const reorderSections = useMutationReorderSections(eventId, {
    onSuccess: (resp) => {
      return resp
    },
    onError: (error) => {
      console.error('Error (useReorderSections):', error)
    },
  })

  return reorderSections
}
