import { useEffect } from 'react'
import { useQueryResponses } from '@/api/responses'

export const useGetResponses = (eventId: string) => {
  const query = useQueryResponses(eventId)

  useEffect(() => {
    if (query.data) {
      return
    }
  }, [query.data])

  useEffect(() => {
    if (query.error) {
      console.error('Error (useGetResponses):', query.error)
    }
  }, [query.error])

  return query
}
