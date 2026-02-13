import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.ts";

export type WorkspaceStats = {
  totalBoards: number;
  totalItems: number;
  activeAgents: number;
  activeAutomations: number;
  automationRunsThisWeek: number;
  agentRunsThisWeek: number;
  itemsByStatus: Record<string, number>;
};

export type ActivityEntry = {
  id: string;
  type: string;
  boardId: string | null;
  itemId: string | null;
  actorId: string | null;
  actorType: string | null;
  changes: {
    field?: string;
    oldValue?: unknown;
    newValue?: unknown;
    description?: string;
  } | null;
  createdAt: string;
  actorName: string | null;
};

export type TimelinePoint = {
  date: string;
  count: number;
};

export type BoardBreakdownEntry = {
  boardId: string;
  boardName: string;
  itemCount: number;
};

type StatsResponse = { data: WorkspaceStats };
type ActivityResponse = { data: ActivityEntry[] };
type TimelineResponse = { data: TimelinePoint[] };
type BreakdownResponse = { data: BoardBreakdownEntry[] };
type ReportResponse = { data: { report: string } };

export function useDashboardStats(workspaceId: string | undefined) {
  return useQuery<StatsResponse>({
    queryKey: ["dashboard-stats", workspaceId],
    queryFn: () =>
      api.getDashboardStats(workspaceId!) as Promise<StatsResponse>,
    enabled: !!workspaceId,
    refetchInterval: 30_000,
  });
}

export function useActivityFeed(workspaceId: string | undefined) {
  return useQuery<ActivityResponse>({
    queryKey: ["dashboard-activity", workspaceId],
    queryFn: () =>
      api.getActivityFeed(workspaceId!) as Promise<ActivityResponse>,
    enabled: !!workspaceId,
    refetchInterval: 30_000,
  });
}

export function useActivityTimeline(workspaceId: string | undefined) {
  return useQuery<TimelineResponse>({
    queryKey: ["dashboard-timeline", workspaceId],
    queryFn: () =>
      api.getActivityTimeline(workspaceId!) as Promise<TimelineResponse>,
    enabled: !!workspaceId,
  });
}

export function useBoardBreakdown(workspaceId: string | undefined) {
  return useQuery<BreakdownResponse>({
    queryKey: ["dashboard-breakdown", workspaceId],
    queryFn: () =>
      api.getBoardBreakdown(workspaceId!) as Promise<BreakdownResponse>,
    enabled: !!workspaceId,
  });
}

export function useGenerateReport() {
  return useMutation<
    ReportResponse,
    Error,
    { workspaceId: string; providerId?: string; model?: string }
  >({
    mutationFn: (data) =>
      api.generateReport(data) as Promise<ReportResponse>,
  });
}
