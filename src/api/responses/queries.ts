import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import { apiClient, publicApiClient } from "@/config/api-client";
import { Api } from "@/constants/api";
import { QUERY_KEYS } from "../queryKeys";
import type {
  FormAnalyticsEvent,
  FormResponse,
  FormResponseProgress,
} from "@/types/form";
import type {
  SaveResponseProgressPayload,
  SubmitResponsePayload,
  TrackAnalyticsEventPayload,
  UpdateResponsePayload,
} from "@/types/api";

function isMissingEndpoint(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 404
  );
}

export function useQueryResponses(eventId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.RESPONSES, eventId],
    queryFn: async () => {
      const { data } = await apiClient.get<FormResponse[]>(
        Api.responses(eventId),
      );
      return data;
    },
    enabled: !!eventId,
  });
}

export function useQueryResponseProgress(eventId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.RESPONSE_PROGRESS, eventId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<FormResponseProgress[]>(
          Api.responseProgress(eventId),
        );
        return data;
      } catch (error) {
        if (isMissingEndpoint(error)) return [];
        throw error;
      }
    },
    enabled: !!eventId,
    retry: false,
  });
}

export function useQueryAnalyticsEvents(eventId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ANALYTICS_EVENTS, eventId],
    queryFn: async () => {
      const { data } = await apiClient.get<FormAnalyticsEvent[]>(
        Api.eventAnalytics(eventId),
      );
      return data;
    },
    enabled: !!eventId,
  });
}

export function useMutationTrackPublicAnalyticsEvent(
  eventId: string,
  options?: UseMutationOptions<
    FormAnalyticsEvent,
    Error,
    TrackAnalyticsEventPayload
  >,
) {
  return useMutation({
    mutationFn: async (payload: TrackAnalyticsEventPayload) => {
      const { data } = await publicApiClient.post<FormAnalyticsEvent>(
        Api.publicEventAnalytics(eventId),
        payload,
      );
      return data;
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}

export function useMutationSubmitResponse(
  eventId: string,
  options?: UseMutationOptions<FormResponse, Error, SubmitResponsePayload>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitResponsePayload) => {
      const { data } = await apiClient.post<FormResponse>(
        Api.responses(eventId),
        payload,
      );
      return data;
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESPONSES, eventId] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId],
      });
      options?.onSuccess?.(...args);
    },
    onError: options?.onError,
  });
}

export function useMutationSubmitPublicResponse(
  eventId: string,
  options?: UseMutationOptions<FormResponse, Error, SubmitResponsePayload>,
) {
  return useMutation({
    mutationFn: async (payload: SubmitResponsePayload) => {
      const { data } = await publicApiClient.post<FormResponse>(
        Api.publicResponses(eventId),
        payload,
      );
      return data;
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}

export function useMutationSavePublicResponseProgress(
  eventId: string,
  options?: UseMutationOptions<
    FormResponseProgress,
    Error,
    SaveResponseProgressPayload
  >,
) {
  return useMutation({
    mutationFn: async ({ progressId, ...payload }) => {
      const endpoint = progressId
        ? Api.publicResponseProgressDetail(eventId, progressId)
        : Api.publicResponseProgress(eventId);
      const { data } = progressId
        ? await publicApiClient.patch<FormResponseProgress>(endpoint, payload)
        : await publicApiClient.post<FormResponseProgress>(endpoint, payload);
      return data;
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}

export function useMutationDeletePublicResponseProgress(
  eventId: string,
  options?: UseMutationOptions<void, Error, string>,
) {
  return useMutation({
    mutationFn: async (progressId: string) => {
      await publicApiClient.delete(
        Api.publicResponseProgressDetail(eventId, progressId),
      );
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}

export function useMutationUpdateResponse(
  eventId: string,
  options?: UseMutationOptions<
    FormResponse,
    Error,
    { responseId: string; payload: UpdateResponsePayload }
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ responseId, payload }) => {
      const { data } = await apiClient.patch<FormResponse>(
        Api.responseDetail(eventId, responseId),
        payload,
      );
      return data;
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESPONSES, eventId] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId],
      });
      options?.onSuccess?.(...args);
    },
    onError: options?.onError,
  });
}

export function useMutationUpdateResponseProgress(
  eventId: string,
  options?: UseMutationOptions<
    FormResponseProgress,
    Error,
    { progressId: string; payload: SaveResponseProgressPayload }
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ progressId, payload }) => {
      const { data } = await apiClient.patch<FormResponseProgress>(
        Api.responseProgressDetail(eventId, progressId),
        payload,
      );
      return data;
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RESPONSE_PROGRESS, eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId],
      });
      options?.onSuccess?.(...args);
    },
    onError: options?.onError,
  });
}

export function useMutationDeleteResponseProgress(
  eventId: string,
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progressId: string) => {
      await apiClient.delete(Api.responseProgressDetail(eventId, progressId));
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RESPONSE_PROGRESS, eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId],
      });
      options?.onSuccess?.(...args);
    },
    onError: options?.onError,
  });
}

export function useMutationDeleteResponse(
  eventId: string,
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (responseId: string) => {
      await apiClient.delete(Api.responseDetail(eventId, responseId));
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESPONSES, eventId] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId],
      });
      options?.onSuccess?.(...args);
    },
    onError: options?.onError,
  });
}
