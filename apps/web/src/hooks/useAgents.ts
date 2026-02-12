import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import type { Agent, AgentRun } from "@forge/shared";

type AgentsResponse = { data: Agent[]; total: number };
type AgentDetailResponse = { data: Agent & { runs: AgentRun[] } };
type AgentResponse = { data: Agent };

export function useAgents(workspaceId: string | undefined) {
  return useQuery<AgentsResponse>({
    queryKey: ["agents", workspaceId],
    queryFn: () => api.listAgents(workspaceId!) as Promise<AgentsResponse>,
    enabled: !!workspaceId,
  });
}

export function useAgent(id: string | undefined) {
  return useQuery<AgentDetailResponse>({
    queryKey: ["agent", id],
    queryFn: () => api.getAgent(id!) as Promise<AgentDetailResponse>,
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation<
    AgentResponse,
    Error,
    Parameters<typeof api.createAgent>[0]
  >({
    mutationFn: (data) => api.createAgent(data) as Promise<AgentResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation<
    AgentResponse,
    Error,
    { id: string; data: Record<string, unknown> }
  >({
    mutationFn: ({ id, data }) =>
      api.updateAgent(id, data) as Promise<AgentResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent"] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { id: string }>({
    mutationFn: ({ id }) => api.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useTriggerAgent() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { id: string; prompt?: string }>({
    mutationFn: ({ id, prompt }) => api.triggerAgent(id, prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent"] });
    },
  });
}
