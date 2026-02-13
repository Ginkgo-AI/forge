import { useEffect } from "react";
import { create } from "zustand";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
};

type ToastStore = {
  toasts: Toast[];
  add: (type: ToastType, message: string, duration?: number) => void;
  remove: (id: string) => void;
};

let nextId = 0;

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (type, message, duration = 4000) => {
    const id = String(++nextId);
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }));
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().add("success", message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().add("error", message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().add("info", message, duration),
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-forge-success shrink-0" />,
  error: <AlertCircle size={16} className="text-forge-danger shrink-0" />,
  info: <Info size={16} className="text-forge-accent shrink-0" />,
};

function ToastItem({ toast: t }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove);

  useEffect(() => {
    const timer = setTimeout(() => remove(t.id), t.duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, remove]);

  return (
    <div className="flex items-start gap-3 bg-forge-surface border border-forge-border rounded-lg px-4 py-3 shadow-lg min-w-[280px] max-w-sm animate-in slide-in-from-right fade-in">
      {icons[t.type]}
      <p className="text-sm text-forge-text flex-1">{t.message}</p>
      <button
        onClick={() => remove(t.id)}
        className="p-0.5 rounded hover:bg-forge-surface-hover transition-colors shrink-0"
      >
        <X size={14} className="text-forge-text-muted" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
