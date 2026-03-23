import { useMutation } from '@tanstack/react-query'
import { apiClient, publicApiClient } from '@/config/api-client'
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

export function useMutationUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await publicApiClient.post<{ url: string; filename: string }>(
        Api.uploadFile,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return data
    },
  })
}
