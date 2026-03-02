/**
 * ToastContext
 * Toast notifications: top-right, distinct colors per type, smooth fade-in/out.
 * Use showToast(message, type) to display a brief message.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastState {
  message: string;
  type: ToastType;
  isExiting: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4000;
const FADE_OUT_MS = 300;

const TOAST_STYLES: Record<ToastType, string> = {
  success:
    "bg-success/95 text-surface border-success shadow-lg",
  error:
    "bg-danger/95 text-surface border-danger shadow-lg",
  warning:
    "bg-warning/95 text-text border-warning shadow-lg",
  info:
    "bg-surface border-border text-text shadow-lg",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);

    setToast({ message, type, isExiting: false });

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setToast((prev) => (prev ? { ...prev, isExiting: true } : null));
      exitTimeoutRef.current = setTimeout(() => {
        exitTimeoutRef.current = null;
        setToast(null);
      }, FADE_OUT_MS);
    }, TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-[9999] max-w-[min(calc(100vw-2rem),24rem)] rounded-lg border-2 px-4 py-3 text-sm font-medium ${
            TOAST_STYLES[toast.type]
          } ${toast.isExiting ? "toast-exit" : "toast-enter"}`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue | null {
  return useContext(ToastContext);
}
