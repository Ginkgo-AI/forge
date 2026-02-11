import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import type { Board } from "@forge/shared";

type BoardsResponse = { data: Board[]; total: number };

type BoardDetailResponse = {
  data: Board & {
    columns: Array<{
      id: string;
      boardId: string;
      title: string;
      type: string;
      position: number;
      config: Record<string, unknown>;
    }>;
    groups: Array<{
      id: string;
      boardId: string;
      title: string;
      color: string;
      position: number;
      collapsed: boolean;
    }>;
  };
};

export function useBoards(workspaceId: string | undefined) {
  return useQuery<BoardsResponse>({
    queryKey: ["boards", workspaceId],
    queryFn: () => api.listBoards(workspaceId!) as Promise<BoardsResponse>,
    enabled: !!workspaceId,
  });
}

export function useBoard(boardId: string | undefined) {
  return useQuery<BoardDetailResponse>({
    queryKey: ["board", boardId],
    queryFn: () => api.getBoard(boardId!) as Promise<BoardDetailResponse>,
    enabled: !!boardId,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      workspaceId: string;
      description?: string;
    }) => api.createBoard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}
