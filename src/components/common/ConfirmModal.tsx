/**
 * ConfirmModal
 * Reusable confirmation dialog: title, message, Cancel + Confirm.
 * Use instead of window.confirm for archive, delete, or other destructive actions.
 */

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  /** danger for destructive (archive/delete), primary for neutral confirm */
  variant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel,
  variant = "danger",
  onConfirm,
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-text text-sm">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="min-h-[44px]"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={handleConfirm}
            className="min-h-[44px]"
            disabled={loading}
          >
            {loading ? "…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
