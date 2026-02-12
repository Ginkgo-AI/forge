import { useState, useRef, useEffect } from "react";

type DateEditorProps = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export function DateEditor({ value, onChange }: DateEditorProps) {
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

  const displayValue = value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="w-full text-left">
        {displayValue ? (
          <span className="text-sm">{displayValue}</span>
        ) : (
          <span className="text-sm text-forge-text-muted">-</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 bg-forge-surface border border-forge-border rounded-md shadow-lg p-2">
          <input
            type="date"
            autoFocus
            value={value ? value.slice(0, 10) : ""}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(false);
            }}
            className="bg-transparent border border-forge-border rounded px-2 py-1 text-sm focus:outline-none focus:border-forge-accent"
          />
        </div>
      )}
    </div>
  );
}
