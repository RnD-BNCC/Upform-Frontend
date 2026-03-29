import { useMutationDeleteSection } from '@/api/sections'

export const useDeleteSection = (eventId: string) => {
  const deleteSection = useMutationDeleteSection(eventId, {
    onSuccess: (resp) => {
      return resp
    },
    onError: (error) => {
      console.error('Error (useDeleteSection):', error)
    },
  })

  return deleteSection
}
