import { useEffect } from 'react'
import { useQueryEventDetail } from '@/api/events'

export const useGetEventDetail = (eventId: string, enabled = true) => {
  const query = useQueryEventDetail(eventId, enabled)

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
