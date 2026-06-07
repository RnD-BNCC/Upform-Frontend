import { useEffect } from 'react'
import { useQueryEventQuestions } from '@/api/events'

export const useGetEventQuestions = (eventId: string) => {
  const query = useQueryEventQuestions(eventId)

  useEffect(() => {
    if (query.error) {
      console.error('Error (useGetEventQuestions):', query.error)
    }
  }, [query.error])

  return query
}
