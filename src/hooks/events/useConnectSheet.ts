import { useMutationConnectSheet } from '@/api/events'

export const useConnectSheet = (eventId: string) => {
  return useMutationConnectSheet({
    onError: (error) => {
      console.error('Error (useConnectSheet):', error)
    },
  })
}
