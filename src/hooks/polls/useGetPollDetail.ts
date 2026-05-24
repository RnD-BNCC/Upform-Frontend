import { useEffect } from 'react'
import { useQueryPollDetail } from '@/api/polls'

export const useGetPollDetail = (pollId: string, enabled = true) => {
  const query = useQueryPollDetail(pollId, enabled)

  useEffect(() => {
    if (query.error) {
      console.error('Error (useGetPollDetail):', query.error)
    }
  }, [query.error])

  return query
}
