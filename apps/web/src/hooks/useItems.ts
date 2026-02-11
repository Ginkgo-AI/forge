import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import type { Item } from "@forge/shared";

type ItemsResponse = { data: Item[]; total: number };
type ItemResponse = { data: Item };

export function useItems(boardId: string | undefined) {
  return useQuery<ItemsResponse>({
    queryKey: ["items", boardId],
    queryFn: () => api.listItems(boardId!) as Promise<ItemsResponse>,
    enabled: !!boardId,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation<
    ItemResponse,
    Error,
    { boardId: string; groupId: string; name: string }
  >({
    mutationFn: (data) => api.createItem(data) as Promise<ItemResponse>,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["items", variables.boardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["board", variables.boardId],
      });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation<
    ItemResponse,
    Error,
    { id: string; boardId: string; data: Record<string, unknown> }
  >({
    mutationFn: ({ id, data }) =>
      api.updateItem(id, data) as Promise<ItemResponse>,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["items", variables.boardId],
      });
    },
  });
}
