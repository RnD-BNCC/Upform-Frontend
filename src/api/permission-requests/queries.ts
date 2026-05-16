import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/config/api-client'
import { Api } from '@/constants/api'
import { QUERY_KEYS } from '@/api/queryKeys'
import type {
  CreatePermissionRequestPayload,
  PermissionRequest,
  PermissionRequestListResponse,
} from '@/types/api'

export function useQueryPermissionRequests(status?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PERMISSION_REQUESTS, status ?? 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<PermissionRequestListResponse>(
        Api.permissionRequests,
        { params: status ? { status } : undefined },
      )
      return data
    },
    retry: false,
  })
}

export function useMutationCreatePermissionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreatePermissionRequestPayload) => {
      const { data } = await apiClient.post<PermissionRequest>(
        Api.permissionRequests,
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERMISSION_REQUESTS] })
    },
  })
}

export function useMutationApprovePermissionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<PermissionRequest>(
        Api.permissionRequestApprove(id),
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERMISSION_REQUESTS] })
    },
  })
}

export function useMutationRejectPermissionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<PermissionRequest>(
        Api.permissionRequestReject(id),
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERMISSION_REQUESTS] })
    },
  })
}
