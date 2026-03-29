import { useEffect } from 'react'
import { useQuerySections } from '@/api/sections'

export const useGetSections = (eventId: string) => {
  const query = useQuerySections(eventId)

  useEffect(() => {
    if (query.data) {
      return
    }
  }, [query.data])

  useEffect(() => {
    if (query.error) {
      console.error('Error (useGetSections):', query.error)
    }
  }, [query.error])

  return query
}
