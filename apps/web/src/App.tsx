import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout.tsx";
import { BoardPage } from "./pages/BoardPage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { AgentsPage } from "./pages/AgentsPage.tsx";
import { AutomationsPage } from "./pages/AutomationsPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { SettingsPage } from "./pages/SettingsPage.tsx";
import { DocumentsPage } from "./pages/DocumentsPage.tsx";
import { useWorkspaces } from "./hooks/useWorkspaces.ts";
import { useWorkspaceStore } from "./stores/workspace.ts";
import { authClient } from "./lib/auth-client.ts";
import { api } from "./lib/api.ts";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.tsx";
import { Toaster } from "./components/ui/Toaster.tsx";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    // In dev mode, skip auth guard (dev auto-login handles it)
    if (isDev) return;
    if (!isPending && !session) {
      navigate("/login", { replace: true });
    }
  }, [session, isPending, isDev, navigate]);

  // In dev mode, always render children
  if (isDev) return <>{children}</>;
  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen bg-forge-bg">
        <div className="text-forge-text-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (!session) return null;
  return <>{children}</>;
}

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
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/boards/:boardId" element={<BoardPage />} />
          <Route path="/boards/:boardId/automations" element={<AutomationsPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/docs" element={<DocumentsPage />} />
          <Route path="/docs/:docId" element={<DocumentsPage />} />
        </Route>
      </Routes>
      <Toaster />
    </ErrorBoundary>
  );
}
