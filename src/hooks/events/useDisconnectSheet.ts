import { useMutationDisconnectSheet } from '@/api/events'

export const useDisconnectSheet = (_eventId: string) => {
  return useMutationDisconnectSheet({
    onError: (error) => {
      console.error('Error (useDisconnectSheet):', error)
    },
  })
}
