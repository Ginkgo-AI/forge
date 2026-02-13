import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";

export function useDocuments(workspaceId?: string) {
  return useQuery({
    queryKey: ["documents", workspaceId],
    queryFn: () => api.listDocuments(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useDocument(id?: string) {
  return useQuery({
    queryKey: ["documents", "detail", id],
    queryFn: () => api.getDocument(id!),
    enabled: !!id,
  });
}

export function useCreateDocument(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { workspaceId: string; title: string; content?: string; parentDocId?: string }) =>
      api.createDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
    },
  });
}

export function useUpdateDocument(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; content?: string }) =>
      api.updateDocument(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["documents", "detail", variables.id] });
    },
  });
}

export function useDeleteDocument(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
    },
  });
}
