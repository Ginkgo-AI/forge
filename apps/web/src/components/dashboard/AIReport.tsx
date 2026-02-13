import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { useGenerateReport } from "../../hooks/useDashboard.ts";

type Props = {
  workspaceId: string | undefined;
};

export function AIReport({ workspaceId }: Props) {
  const [report, setReport] = useState<string | null>(null);
  const generateReport = useGenerateReport();

  const handleGenerate = () => {
    if (!workspaceId) return;
    generateReport.mutate(
      { workspaceId },
      { onSuccess: (res) => setReport(res.data.report) }
    );
  };

  return (
    <div className="bg-forge-surface border border-forge-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">AI Workspace Report</h3>
        <button
          onClick={handleGenerate}
          disabled={generateReport.isPending || !workspaceId}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-forge-accent text-white hover:bg-forge-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generateReport.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <FileText size={14} />
          )}
          {generateReport.isPending ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {generateReport.isError && (
        <p className="text-sm text-red-400 mb-3">
          Failed to generate report: {generateReport.error.message}
        </p>
      )}

      {report ? (
        <div className="prose prose-invert prose-sm max-w-none text-forge-text-muted">
          {report.split("\n").map((line, i) => {
            if (line.startsWith("### "))
              return (
                <h4 key={i} className="text-white font-semibold mt-3 mb-1">
                  {line.replace("### ", "")}
                </h4>
              );
            if (line.startsWith("## "))
              return (
                <h3 key={i} className="text-white font-bold mt-4 mb-1">
                  {line.replace("## ", "")}
                </h3>
              );
            if (line.startsWith("# "))
              return (
                <h2 key={i} className="text-white font-bold mt-4 mb-2">
                  {line.replace("# ", "")}
                </h2>
              );
            if (line.startsWith("- "))
              return (
                <li key={i} className="ml-4 list-disc">
                  {line.replace("- ", "")}
                </li>
              );
            if (line.startsWith("**"))
              return (
                <p key={i} className="font-semibold text-white">
                  {line.replace(/\*\*/g, "")}
                </p>
              );
            if (line.trim() === "") return <br key={i} />;
            return <p key={i}>{line}</p>;
          })}
        </div>
      ) : (
        <p className="text-sm text-forge-text-muted">
          Generate an AI-powered narrative summary of your workspace activity,
          metrics, and trends.
        </p>
      )}
    </div>
  );
}
