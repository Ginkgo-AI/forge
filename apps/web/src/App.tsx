import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { useWorkspaces } from "./hooks/useWorkspaces.ts";
import { useWorkspaceStore } from "./stores/workspace.ts";
import { authClient } from "./lib/auth-client.ts";
import { api } from "./lib/api.ts";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.tsx";
import { Toaster } from "./components/ui/Toaster.tsx";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const DashboardPage = lazy(() => import("./pages/DashboardPage.tsx").then((m) => ({ default: m.DashboardPage })));
const BoardPage = lazy(() => import("./pages/BoardPage.tsx").then((m) => ({ default: m.BoardPage })));
const AgentsPage = lazy(() => import("./pages/AgentsPage.tsx").then((m) => ({ default: m.AgentsPage })));
const AutomationsPage = lazy(() => import("./pages/AutomationsPage.tsx").then((m) => ({ default: m.AutomationsPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage.tsx").then((m) => ({ default: m.SettingsPage })));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage.tsx").then((m) => ({ default: m.DocumentsPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-forge-text-muted" size={24} />
    </div>
  );
}

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
          <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="/boards/:boardId" element={<Suspense fallback={<PageLoader />}><BoardPage /></Suspense>} />
          <Route path="/boards/:boardId/automations" element={<Suspense fallback={<PageLoader />}><AutomationsPage /></Suspense>} />
          <Route path="/agents" element={<Suspense fallback={<PageLoader />}><AgentsPage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          <Route path="/docs" element={<Suspense fallback={<PageLoader />}><DocumentsPage /></Suspense>} />
          <Route path="/docs/:docId" element={<Suspense fallback={<PageLoader />}><DocumentsPage /></Suspense>} />
        </Route>
      </Routes>
      <Toaster />
    </ErrorBoundary>
  );
}
