import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/config/api-client'
import { Api } from '@/constants/api'
import { QUERY_KEYS } from '@/api/queryKeys'
import type { UserSearchResponse } from '@/types/api'

type UserSearchParams = {
  q?: string
  take?: number
}

export function useQueryUsers(params: UserSearchParams = {}, enabled = true) {
  return useQuery({
    queryKey: [QUERY_KEYS.USERS, params],
    queryFn: async () => {
      const { data } = await apiClient.get<UserSearchResponse>(Api.usersSearch, {
        params,
      })
      return data
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}
