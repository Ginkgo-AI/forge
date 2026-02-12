import { Modal } from "./Modal.tsx";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-forge-text-muted mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-md text-forge-text-muted hover:bg-forge-surface-hover transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 text-sm rounded-md text-white transition-colors ${
            variant === "danger"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-forge-accent hover:bg-forge-accent-hover"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
