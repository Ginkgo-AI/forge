import { useState, useRef, useEffect } from "react";
import type { ColumnConfig } from "@forge/shared";

type StatusEditorProps = {
  value: string | undefined;
  labels: NonNullable<ColumnConfig["labels"]>;
  onChange: (value: string) => void;
};

const fallbackColors: Record<string, string> = {
  not_started: "#C4C4C4",
  working: "#FDAB3D",
  stuck: "#E2445C",
  done: "#00C875",
  high: "#E2445C",
  medium: "#FDAB3D",
  low: "#579BFC",
  critical: "#333333",
};

export function StatusEditor({ value, labels, onChange }: StatusEditorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const current = value && labels[value] ? labels[value] : null;
  const color = current?.color || (value ? fallbackColors[value] : undefined);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left"
      >
        {current ? (
          <span
            className="inline-block px-2.5 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {current.label}
          </span>
        ) : (
          <span className="text-sm text-forge-text-muted">-</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 bg-forge-surface border border-forge-border rounded-md shadow-lg py-1 min-w-[160px]">
          {Object.entries(labels).map(([key, labelObj]) => (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-forge-surface-hover transition-colors"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: labelObj.color || fallbackColors[key] || "#C4C4C4" }}
              />
              {labelObj.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
