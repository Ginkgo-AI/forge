import { useState, useRef, useEffect } from "react";
import { useMembers } from "../../hooks/useMembers.ts";
import { useWorkspaceStore } from "../../stores/workspace.ts";

type PersonEditorProps = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export function PersonEditor({ value, onChange }: PersonEditorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const { data: membersData } = useMembers(currentWorkspace?.id);
  const members = membersData?.data ?? [];

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

  const currentMember = members.find((m) => m.userId === value);
  const displayName = currentMember?.user?.name;

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="w-full text-left">
        {displayName ? (
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-forge-accent/20 text-forge-accent text-xs flex items-center justify-center font-medium">
              {getInitials(displayName)}
            </span>
            <span className="text-sm truncate">{displayName}</span>
          </div>
        ) : (
          <span className="text-sm text-forge-text-muted">-</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 bg-forge-surface border border-forge-border rounded-md shadow-lg py-1 min-w-[180px] max-h-48 overflow-y-auto">
          {members.map((member) => (
            <button
              key={member.userId}
              onClick={() => {
                onChange(member.userId);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-forge-surface-hover transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-forge-accent/20 text-forge-accent text-xs flex items-center justify-center font-medium shrink-0">
                {member.user?.name ? getInitials(member.user.name) : "?"}
              </span>
              <span className="truncate">{member.user?.name || member.userId}</span>
            </button>
          ))}
          {members.length === 0 && (
            <div className="px-3 py-2 text-sm text-forge-text-muted">
              No members
            </div>
          )}
        </div>
      )}
    </div>
  );
}
