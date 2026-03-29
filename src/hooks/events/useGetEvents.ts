import { useEffect } from 'react'
import { useQueryEvents } from '@/api/events'
import type { EventListParams } from '@/types/api'

export const useGetEvents = (params: EventListParams = {}) => {
  const query = useQueryEvents(params)

  useEffect(() => {
    if (query.data) {
      return
    }
  }, [query.data])

  useEffect(() => {
    if (query.error) {
      console.error('Error (useGetEvents):', query.error)
    }
  }, [query.error])

  return query
}
