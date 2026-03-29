import { useMutationDisconnectSheet } from '@/api/events'

export const useDisconnectSheet = (eventId: string) => {
  return useMutationDisconnectSheet({
    onError: (error) => {
      console.error('Error (useDisconnectSheet):', error)
    },
  })
}
