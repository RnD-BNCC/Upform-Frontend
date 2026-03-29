import { useMutationSubmitPublicResponse } from '@/api/responses'

export const useSubmitPublicResponse = (eventId: string) => {
  const submitPublicResponse = useMutationSubmitPublicResponse(eventId, {
    onSuccess: (resp) => {
      return resp
    },
    onError: (error) => {
      console.error('Error (useSubmitPublicResponse):', error)
    },
  })

  return submitPublicResponse
}
