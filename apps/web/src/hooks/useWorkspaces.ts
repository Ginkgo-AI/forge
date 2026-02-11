import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import type { Workspace } from "@forge/shared";

type WorkspacesResponse = { data: Workspace[]; total: number };
type WorkspaceResponse = { data: Workspace };

export function useWorkspaces() {
  return useQuery<WorkspacesResponse>({
    queryKey: ["workspaces"],
    queryFn: () => api.listWorkspaces() as Promise<WorkspacesResponse>,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation<
    WorkspaceResponse,
    Error,
    { name: string; description?: string }
  >({
    mutationFn: (data) =>
      api.createWorkspace(data) as Promise<WorkspaceResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
