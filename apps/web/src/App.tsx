import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout.tsx";
import { BoardPage } from "./pages/BoardPage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { AgentsPage } from "./pages/AgentsPage.tsx";
import { useWorkspaces } from "./hooks/useWorkspaces.ts";
import { useWorkspaceStore } from "./stores/workspace.ts";
import { api } from "./lib/api.ts";

export function App() {
  const { data: wsData } = useWorkspaces();
  const { currentWorkspace, setCurrentWorkspace, setCurrentUser } =
    useWorkspaceStore();

  // Auto-select first workspace on load
  useEffect(() => {
    if (wsData?.data?.length && !currentWorkspace) {
      setCurrentWorkspace(wsData.data[0]);
    }
  }, [wsData, currentWorkspace, setCurrentWorkspace]);

  // Load current user
  useEffect(() => {
    api
      .listWorkspaces()
      .then(() =>
        fetch("/api/v1/users/me", { credentials: "include" })
          .then((r) => r.json())
          .then((r: any) => {
            if (r.data) setCurrentUser(r.data);
          })
      )
      .catch(() => {});
  }, [setCurrentUser]);

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/boards/:boardId" element={<BoardPage />} />
        <Route path="/agents" element={<AgentsPage />} />
      </Route>
    </Routes>
  );
}
