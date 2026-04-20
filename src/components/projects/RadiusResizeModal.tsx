/**
 * RadiusResizeModal
 * Modal to change project radius. Slider (100m–10km); confirmation when reducing.
 */

import { useState, useEffect } from "react";
import { Modal, Button } from "../common";
import { useFormatters } from "../../contexts/PreferencesContext";

export interface RadiusResizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRadiusMeters: number;
  onResize: (newRadiusMeters: number) => Promise<void>;
}

export function RadiusResizeModal({
  isOpen,
  onClose,
  currentRadiusMeters,
  onResize,
}: RadiusResizeModalProps) {
  const { formatRadius } = useFormatters();
  const [selected, setSelected] = useState(currentRadiusMeters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setSelected(currentRadiusMeters);
  }, [isOpen, currentRadiusMeters]);

  const isReducing = selected < currentRadiusMeters;

  const handleSubmit = async () => {
    if (selected === currentRadiusMeters) {
      onClose();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onResize(selected);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update radius");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change project radius"
      size="large"
    >
      <div className="flex flex-col gap-4">
        <p className="text-text text-sm">
          Current radius: {formatRadius(currentRadiusMeters)}
        </p>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-text">New radius</span>
            <span className="rounded bg-success/20 px-2 py-1 text-sm font-bold text-success">
              {formatRadius(selected)}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-border accent-success"
            aria-label="Project radius"
          />
          <div className="mt-1 flex justify-between text-xs text-text-muted">
            <span>{formatRadius(100)}</span>
            <span>{formatRadius(10000)}</span>
          </div>
        </div>
        {isReducing && (
          <p className="rounded border border-warning bg-warning/10 p-2 text-text-muted text-sm">
            Reducing radius may remove streets outside the new boundary. Your
            progress on remaining streets is preserved.
          </p>
        )}
        {error && <p className="text-danger text-sm">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={selected === currentRadiusMeters || loading}
            className="min-h-[44px]"
          >
            {loading ? "Updating…" : "Update radius"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
