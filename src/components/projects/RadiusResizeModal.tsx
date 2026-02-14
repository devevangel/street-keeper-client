/**
 * RadiusResizeModal
 * Modal to change project radius. Pill buttons for radius options; confirmation when reducing.
 */

import { useState } from "react";
import { Modal, Button } from "../common";

const RADIUS_OPTIONS: { value: number; label: string }[] = [
  { value: 100, label: "100 m" },
  { value: 200, label: "200 m" },
  { value: 500, label: "500 m" },
  { value: 1000, label: "1 km" },
  { value: 2000, label: "2 km" },
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
];

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
  const [selected, setSelected] = useState(currentRadiusMeters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          Current radius:{" "}
          {currentRadiusMeters >= 1000
            ? `${currentRadiusMeters / 1000} km`
            : `${currentRadiusMeters} m`}
        </p>
        <div>
          <span className="mb-2 block text-sm font-medium text-text">
            New radius
          </span>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Project radius"
          >
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected === opt.value}
                onClick={() => setSelected(opt.value)}
                className={`min-h-[44px] min-w-[44px] rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  selected === opt.value
                    ? "border-primary bg-primary text-surface"
                    : "border-border bg-surface text-text hover:border-primary/70"
                }`}
              >
                {opt.label}
              </button>
            ))}
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
