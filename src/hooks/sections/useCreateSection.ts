import { useMutationCreateSection } from '@/api/sections'

export const useCreateSection = (eventId: string) => {
  const createSection = useMutationCreateSection(eventId, {
    onSuccess: (resp) => {
      return resp
    },
    onError: (error) => {
      console.error('Error (useCreateSection):', error)
    },
  })

  return createSection
}
