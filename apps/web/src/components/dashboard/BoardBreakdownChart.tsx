import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BoardBreakdownEntry } from "../../hooks/useDashboard.ts";

type Props = {
  data: BoardBreakdownEntry[] | undefined;
  isLoading: boolean;
};

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed"];

export function BoardBreakdownChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-forge-surface border border-forge-border rounded-lg p-5">
        <h3 className="text-sm font-semibold mb-4">Items per Board</h3>
        <div className="h-48 flex items-center justify-center text-forge-text-muted text-sm">
          Loading...
        </div>
      </div>
    );
  }

  const chartData = (data ?? []).map((d, i) => ({
    name:
      d.boardName.length > 20
        ? d.boardName.slice(0, 18) + "..."
        : d.boardName,
    items: d.itemCount,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="bg-forge-surface border border-forge-border rounded-lg p-5">
      <h3 className="text-sm font-semibold mb-4">Items per Board</h3>
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-forge-text-muted text-sm">
          No boards yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="name"
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
            <Bar dataKey="items" radius={[4, 4, 0, 0]} name="Items">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
