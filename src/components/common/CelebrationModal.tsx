/**
 * CelebrationModal (common)
 * Generic celebration overlay: confetti, animated counter, optional milestone badges.
 * Use for: post-sync ("42 streets conquered!"), milestone unlock, project creation.
 */

import { useEffect, useRef, useMemo } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AnimatedCounter } from "./AnimatedCounter";

export interface CelebrationBadge {
  id: string;
  name: string;
}

export interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** e.g. "You've already conquered 42 streets!" or "Achievement Unlocked: 100 Streets!" */
  title: string;
  /** Optional: animate from 0 to this number (e.g. 42). Shown prominently. */
  count?: number;
  /** Optional suffix after the count, e.g. " streets" */
  countSuffix?: string;
  /** Optional short message below the count */
  message?: string;
  /** Optional milestone/badge unlocks to show */
  badges?: CelebrationBadge[];
  /** Auto-dismiss after this many ms. Default 5000. 0 = no auto-dismiss. */
  autoDismissMs?: number;
}

const CONFETTI_COLORS = ["green", "blue", "purple", "amber", "red", "pink"] as const;
const CONFETTI_COUNT = 50;

function ConfettiLayer() {
  const pieces = useMemo(() => {
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: `${10 + Math.random() * 80}%`,
      delay: `${Math.random() * 0.5}s`,
      duration: `${2 + Math.random() * 2}s`,
    }));
  }, []);

  return (
    <div className="confetti-burst" aria-hidden>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          data-color={p.color}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

export function CelebrationModal({
  isOpen,
  onClose,
  title,
  count,
  countSuffix = " streets",
  message,
  badges = [],
  autoDismissMs = 5000,
}: CelebrationModalProps) {
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen || autoDismissMs <= 0) return;
    autoDismissRef.current = setTimeout(onClose, autoDismissMs);
    return () => {
      if (autoDismissRef.current) {
        clearTimeout(autoDismissRef.current);
        autoDismissRef.current = null;
      }
    };
  }, [isOpen, autoDismissMs, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <ConfettiLayer />
      <Modal isOpen={true} onClose={onClose} title="Celebration" size="large">
        <div className="text-center">
          <div className="mb-4 text-5xl" aria-hidden>
            🎉
          </div>
          <h2 className="mb-2 text-2xl font-bold text-text">{title}</h2>
          {count != null && (
            <div className="my-4 text-4xl font-bold text-success">
              <AnimatedCounter
                value={count}
                durationMs={2000}
                isActive={isOpen}
                suffix={countSuffix}
              />
            </div>
          )}
          {message && <p className="mb-6 text-text-muted">{message}</p>}
          {badges.length > 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {badges.map((b) => (
                <span
                  key={b.id}
                  className="rounded-lg border-2 border-border bg-bg px-3 py-1 text-sm font-medium"
                >
                  🏅 {b.name}
                </span>
              ))}
            </div>
          )}
          <Button type="button" variant="primary" onClick={onClose} className="w-full">
            Awesome!
          </Button>
        </div>
      </Modal>
    </>
  );
}
