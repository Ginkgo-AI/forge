import { create } from "zustand";
import type { Workspace, Board, User } from "@forge/shared";

type WorkspaceStore = {
  currentWorkspace: Workspace | null;
  boards: Board[];
  currentUser: User | null;
  currentBoardId: string | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setBoards: (boards: Board[]) => void;
  setCurrentUser: (user: User | null) => void;
  setCurrentBoardId: (boardId: string | null) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  currentWorkspace: null,
  boards: [],
  currentUser: null,
  currentBoardId: null,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setBoards: (boards) => set({ boards }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentBoardId: (boardId) => set({ currentBoardId: boardId }),
}));
