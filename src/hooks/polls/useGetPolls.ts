import { useEffect } from 'react'
import { useQueryPolls } from '@/api/polls'

export const useGetPolls = (page = 1, search?: string) => {
  const query = useQueryPolls(page, 9, search)

  useEffect(() => {
    if (query.error) {
      console.error('Error (useGetPolls):', query.error)
    }
  }, [query.error])

  return query
}
