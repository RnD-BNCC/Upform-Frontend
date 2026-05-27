import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, publicApiClient } from "@/config/api-client";
import { Api } from "@/constants/api";
import type {
  ResultShare,
  SharedResultsData,
  UpdateResultSharePayload,
} from "@/types/resultsShare";

function buildLocalShareUrl(token: string, fallback: string) {
  if (!token) return fallback;
  if (typeof window === "undefined") return fallback;
  return `${window.location.origin}/results/share/${token}`;
}

function normalizeShare(share: ResultShare): ResultShare {
  return {
    ...share,
    shareUrl: buildLocalShareUrl(share.token, share.shareUrl),
  };
}

export function useQueryResultShare(eventId: string, enabled = true) {
  return useQuery({
    queryKey: ["result-share", eventId],
    enabled: enabled && !!eventId,
    queryFn: async () => {
      const { data } = await apiClient.get<ResultShare>(Api.resultShare(eventId));
      return normalizeShare(data);
    },
  });
}

export function useMutationUpdateResultShare(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateResultSharePayload) => {
      const { data } = await apiClient.patch<ResultShare>(
        Api.resultShare(eventId),
        payload,
      );
      return normalizeShare(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-share", eventId] });
    },
  });
}

export function useQuerySharedResults(
  token: string,
  authenticated = false,
  enabled = true,
) {
  return useQuery({
    queryKey: ["shared-results", token, authenticated],
    enabled: enabled && !!token,
    retry: false,
    queryFn: async () => {
      const client = authenticated ? apiClient : publicApiClient;
      const { data } = await client.get<SharedResultsData>(
        Api.sharedResults(token),
      );
      return {
        ...data,
        share: normalizeShare(data.share),
      };
    },
  });
}
