import { useMutationUpdateSection } from '@/api/sections'

export const useUpdateSection = (eventId: string) => {
  const updateSection = useMutationUpdateSection(eventId, {
    onSuccess: (resp) => {
      return resp
    },
    onError: (error) => {
      console.error('Error (useUpdateSection):', error)
    },
  })

  return updateSection
}
