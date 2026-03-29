import { useEffect } from 'react'
import { useQueryPollDetail } from '@/api/polls'

export const useGetPollDetail = (pollId: string) => {
  const query = useQueryPollDetail(pollId)

  useEffect(() => {
    if (query.error) {
      console.error('Error (useGetPollDetail):', query.error)
    }
  }, [query.error])

  return query
}
