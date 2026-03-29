import { useMutationConnectSheet } from '@/api/events'

export const useConnectSheet = (_eventId: string) => {
  return useMutationConnectSheet({
    onError: (error) => {
      console.error('Error (useConnectSheet):', error)
    },
  })
}
