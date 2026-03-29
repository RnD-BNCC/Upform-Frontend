import { useEffect } from 'react'
import { useQueryEventDetail } from '@/api/events'

export const useGetEventDetail = (eventId: string) => {
  const query = useQueryEventDetail(eventId)

  useEffect(() => {
    if (query.data) {
      return
    }
  }, [query.data])

  useEffect(() => {
    if (query.error) {
      console.error('Error (useGetEventDetail):', query.error)
    }
  }, [query.error])

  return query
}
