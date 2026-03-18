import { useMutationSubmitResponse } from '@/api/responses'

export const useSubmitResponse = (eventId: string) => {
  const submitResponse = useMutationSubmitResponse(eventId, {
    onSuccess: (resp) => {
      return resp
    },
    onError: (error) => {
      console.error('Error (useSubmitResponse):', error)
    },
  })

  return submitResponse
}
