import { useMutationDeleteResponse } from '@/api/responses'

export const useDeleteResponse = (eventId: string) => {
  const deleteResponse = useMutationDeleteResponse(eventId, {
    onSuccess: (resp) => {
      return resp
    },
    onError: (error) => {
      console.error('Error (useDeleteResponse):', error)
    },
  })

  return deleteResponse
}
