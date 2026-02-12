import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import type { Automation } from "@forge/shared";

type AutomationsResponse = { data: Automation[]; total: number };
type AutomationResponse = { data: Automation };

export function useAutomations(boardId: string | undefined) {
  return useQuery<AutomationsResponse>({
    queryKey: ["automations", boardId],
    queryFn: () =>
      api.listAutomations(boardId!) as Promise<AutomationsResponse>,
    enabled: !!boardId,
  });
}

export function useCreateAutomation() {
  const queryClient = useQueryClient();
  return useMutation<
    AutomationResponse,
    Error,
    Parameters<typeof api.createAutomation>[0]
  >({
    mutationFn: (data) =>
      api.createAutomation(data) as Promise<AutomationResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });
}

export function useUpdateAutomation() {
  const queryClient = useQueryClient();
  return useMutation<
    AutomationResponse,
    Error,
    { id: string; data: Record<string, unknown> }
  >({
    mutationFn: ({ id, data }) =>
      api.updateAutomation(id, data) as Promise<AutomationResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });
}

export function useDeleteAutomation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { id: string }>({
    mutationFn: ({ id }) => api.deleteAutomation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
    },
  });
}
