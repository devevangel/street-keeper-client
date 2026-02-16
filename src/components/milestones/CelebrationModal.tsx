/**
 * CelebrationModal Component (MVP)
 * Celebration modal with share message preview.
 * Note: For full confetti effect, install react-confetti: npm install react-confetti
 */

import { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common";

interface CelebrationModalProps {
  milestone: {
    id: string;
    name: string;
    projectName: string;
    shareMessage: string;
  };
  onClose: () => void;
  onAcknowledge?: (milestoneId: string) => Promise<void>;
}

export function CelebrationModal({
  milestone,
  onClose,
  onAcknowledge,
}: CelebrationModalProps) {
  const [copied, setCopied] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(milestone.shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleAcknowledge = async () => {
    if (onAcknowledge) {
      setAcknowledging(true);
      try {
        await onAcknowledge(milestone.id);
        onClose();
      } catch (err) {
        console.error("Failed to acknowledge:", err);
      } finally {
        setAcknowledging(false);
      }
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Goal Achieved!" size="large">
      <div className="text-center">
        {/* Celebration emoji */}
        <div className="text-6xl mb-4 animate-bounce">🎉</div>

        <h3 className="text-2xl font-bold text-text mb-2">{milestone.name}</h3>
        <p className="text-text-muted mb-6">in {milestone.projectName}</p>

        {/* Share message preview */}
        <div className="mt-4 p-4 bg-muted rounded-lg text-left border-2 border-border">
          <p className="text-sm text-text-muted mb-2 font-medium">Share this:</p>
          <p className="text-sm text-text whitespace-pre-line leading-relaxed">
            {milestone.shareMessage}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopy}
            className="flex-1"
            disabled={copied}
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </Button>
          {/* Future: Share to Strava button */}
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={handleAcknowledge}
          className="mt-4 w-full"
          disabled={acknowledging}
        >
          {acknowledging ? "Saving..." : "Keep Going!"}
        </Button>
      </div>
    </Modal>
  );
}
