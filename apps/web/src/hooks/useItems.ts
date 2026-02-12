import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import type { Item, ItemUpdate } from "@forge/shared";

type ItemsResponse = { data: Item[]; total: number };
type ItemResponse = { data: Item };
type ItemDetailResponse = {
  data: Item & {
    updates?: ItemUpdate[];
    subItems?: Item[];
  };
};
type ItemUpdateResponse = { data: ItemUpdate };

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

export function useItem(itemId: string | undefined) {
  return useQuery<ItemDetailResponse>({
    queryKey: ["item", itemId],
    queryFn: () => api.getItem(itemId!) as Promise<ItemDetailResponse>,
    enabled: !!itemId,
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    Error,
    { id: string; boardId: string }
  >({
    mutationFn: ({ id }) => api.deleteItem(id),
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

export function useAddItemUpdate() {
  const queryClient = useQueryClient();
  return useMutation<
    ItemUpdateResponse,
    Error,
    { itemId: string; body: string }
  >({
    mutationFn: ({ itemId, body }) =>
      api.addItemUpdate(itemId, { body }) as Promise<ItemUpdateResponse>,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["item", variables.itemId],
      });
    },
  });
}
