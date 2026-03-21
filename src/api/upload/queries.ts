import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/config/api-client'
import { Api } from '@/constants/api'

export function useMutationUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await apiClient.post<{ url: string }>(Api.upload, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
  })
}
