import { useEffect } from 'react'
import { useQueryPolls } from '@/api/polls'

export const useGetPolls = (page = 1, search?: string, deleted = false) => {
  const query = useQueryPolls(page, 9, search, deleted)

  useEffect(() => {
    if (query.error) {
      console.error('Error (useGetPolls):', query.error)
    }
  }, [query.error])

  return query
}
