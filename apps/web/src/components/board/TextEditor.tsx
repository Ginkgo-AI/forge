import { useState, useRef, useEffect } from "react";

type TextEditorProps = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export function TextEditor({ value, onChange }: TextEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value ?? "");
      inputRef.current?.focus();
    }
  }, [editing, value]);

  function save() {
    const trimmed = draft.trim();
    if (trimmed !== (value ?? "")) {
      onChange(trimmed);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full bg-transparent border border-forge-accent rounded px-1.5 py-0.5 text-sm focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full text-left text-sm text-forge-text-muted truncate"
    >
      {value || "-"}
    </button>
  );
}
