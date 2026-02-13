import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TimelinePoint } from "../../hooks/useDashboard.ts";

type Props = {
  data: TimelinePoint[] | undefined;
  isLoading: boolean;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityTimeline({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-forge-surface border border-forge-border rounded-lg p-5">
        <h3 className="text-sm font-semibold mb-4">Activity Timeline</h3>
        <div className="h-48 flex items-center justify-center text-forge-text-muted text-sm">
          Loading...
        </div>
      </div>
    );
  }

  const chartData = (data ?? []).map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <div className="bg-forge-surface border border-forge-border rounded-lg p-5">
      <h3 className="text-sm font-semibold mb-4">Activity Timeline</h3>
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-forge-text-muted text-sm">
          No activity data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#888", fontSize: 12 }}
              axisLine={{ stroke: "#444" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#888", fontSize: 12 }}
              axisLine={{ stroke: "#444" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e1e2e",
                border: "1px solid #333",
                borderRadius: 8,
                color: "#e0e0e0",
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              fill="url(#activityGrad)"
              strokeWidth={2}
              name="Events"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
