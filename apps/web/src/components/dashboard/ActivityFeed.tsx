import {
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  Table2,
  Bot,
  Zap,
  MessageSquare,
  Columns3,
  type LucideIcon,
} from "lucide-react";
import type { ActivityEntry } from "../../hooks/useDashboard.ts";

type Props = {
  data: ActivityEntry[] | undefined;
  isLoading: boolean;
};

const typeConfig: Record<string, { icon: LucideIcon; color: string }> = {
  item_created: { icon: Plus, color: "text-green-400" },
  item_updated: { icon: Pencil, color: "text-blue-400" },
  item_deleted: { icon: Trash2, color: "text-red-400" },
  item_moved: { icon: ArrowRight, color: "text-yellow-400" },
  column_value_changed: { icon: Columns3, color: "text-cyan-400" },
  board_created: { icon: Table2, color: "text-indigo-400" },
  board_updated: { icon: Table2, color: "text-indigo-400" },
  automation_triggered: { icon: Zap, color: "text-orange-400" },
  agent_action: { icon: Bot, color: "text-purple-400" },
  ai_chat: { icon: MessageSquare, color: "text-pink-400" },
};

function formatRelative(dateStr: string) {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function describeActivity(entry: ActivityEntry): string {
  const actor = entry.actorName || entry.actorType || "Someone";
  const desc = entry.changes?.description;
  if (desc) return `${actor} ${desc}`;

  const typeLabels: Record<string, string> = {
    item_created: "created an item",
    item_updated: "updated an item",
    item_deleted: "deleted an item",
    item_moved: "moved an item",
    column_value_changed: "changed a column value",
    board_created: "created a board",
    board_updated: "updated a board",
    member_added: "added a member",
    member_removed: "removed a member",
    automation_triggered: "triggered an automation",
    agent_action: "performed an agent action",
    ai_chat: "used AI chat",
  };

  return `${actor} ${typeLabels[entry.type] || entry.type}`;
}

export function ActivityFeed({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-forge-surface border border-forge-border rounded-lg p-5">
        <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <div className="w-6 h-6 rounded bg-forge-border animate-pulse shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-forge-border rounded animate-pulse w-3/4" />
                <div className="h-3 bg-forge-border rounded animate-pulse w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const entries = data ?? [];

  return (
    <div className="bg-forge-surface border border-forge-border rounded-lg p-5">
      <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-forge-text-muted py-4">
          No activity recorded yet
        </p>
      ) : (
        <div className="space-y-1 max-h-[420px] overflow-y-auto">
          {entries.map((entry) => {
            const config = typeConfig[entry.type] ?? {
              icon: Pencil,
              color: "text-forge-text-muted",
            };
            const Icon = config.icon;
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 py-2 border-b border-forge-border last:border-0"
              >
                <Icon size={16} className={`mt-0.5 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-forge-text-muted truncate">
                    {describeActivity(entry)}
                  </p>
                  <p className="text-xs text-forge-text-muted/60">
                    {formatRelative(entry.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
