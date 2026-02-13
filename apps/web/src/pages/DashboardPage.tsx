import { Link } from "react-router-dom";
import { Table2 } from "lucide-react";
import { useBoards } from "../hooks/useBoards.ts";
import { useWorkspaceStore } from "../stores/workspace.ts";
import {
  useDashboardStats,
  useActivityFeed,
  useActivityTimeline,
  useBoardBreakdown,
} from "../hooks/useDashboard.ts";
import { StatsGrid } from "../components/dashboard/StatsGrid.tsx";
import { ActivityTimeline } from "../components/dashboard/ActivityTimeline.tsx";
import { BoardBreakdownChart } from "../components/dashboard/BoardBreakdownChart.tsx";
import { ActivityFeed } from "../components/dashboard/ActivityFeed.tsx";
import { AIReport } from "../components/dashboard/AIReport.tsx";

export function DashboardPage() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const wsId = currentWorkspace?.id;

  const { data: boardsData } = useBoards(wsId);
  const boards = boardsData?.data ?? [];

  const { data: statsData, isLoading: statsLoading } = useDashboardStats(wsId);
  const { data: activityData, isLoading: activityLoading } = useActivityFeed(wsId);
  const { data: timelineData, isLoading: timelineLoading } = useActivityTimeline(wsId);
  const { data: breakdownData, isLoading: breakdownLoading } = useBoardBreakdown(wsId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-forge-text-muted mt-1">
          Overview of your workspace activity
        </p>
      </div>

      {/* Stats grid */}
      <StatsGrid stats={statsData?.data} isLoading={statsLoading} />

      {/* Charts + Activity feed two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityTimeline
            data={timelineData?.data}
            isLoading={timelineLoading}
          />
          <BoardBreakdownChart
            data={breakdownData?.data}
            isLoading={breakdownLoading}
          />
        </div>
        <div>
          <ActivityFeed
            data={activityData?.data}
            isLoading={activityLoading}
          />
        </div>
      </div>

      {/* AI Report */}
      <AIReport workspaceId={wsId} />

      {/* Boards list */}
      {boards.length > 0 && (
        <div className="bg-forge-surface border border-forge-border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Your Boards</h2>
          <div className="space-y-2">
            {boards.map((board) => (
              <Link
                key={board.id}
                to={`/boards/${board.id}`}
                className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-forge-surface-hover transition-colors"
              >
                <Table2 size={18} className="text-forge-accent" />
                <div>
                  <p className="text-sm font-medium">{board.name}</p>
                  {board.description && (
                    <p className="text-xs text-forge-text-muted">
                      {board.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
