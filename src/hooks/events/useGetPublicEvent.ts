import { useEffect } from 'react'
import { useQueryPublicEvent } from '@/api/events'

export const useGetPublicEvent = (eventId: string) => {
  const query = useQueryPublicEvent(eventId)

  useEffect(() => {
    if (query.data) {
      return
    }
  }, [query.data])

  useEffect(() => {
    if (query.error) {
      console.error('Error (useGetPublicEvent):', query.error)
    }
  }, [query.error])

  return query
}
