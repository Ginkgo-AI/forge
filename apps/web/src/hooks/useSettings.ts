import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";

export function useWorkspaceSettings(workspaceId?: string) {
  return useQuery({
    queryKey: ["settings", "workspace", workspaceId],
    queryFn: () => api.getWorkspaceSettings(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useUpdateWorkspaceSettings(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      api.updateWorkspaceSettings(workspaceId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "workspace", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useAISettings() {
  return useQuery({
    queryKey: ["settings", "ai"],
    queryFn: () => api.getAISettings(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; avatarUrl?: string | null }) =>
      api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.changePassword(data),
  });
}
