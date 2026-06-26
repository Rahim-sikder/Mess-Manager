import { useState, useCallback, useEffect } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let _addToast: ((message: string, type: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "success"): void {
  _addToast?.(message, type);
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const TYPE_CLS: Record<ToastType, string> = {
  success: "bg-white border-green-200 text-green-800",
  error:   "bg-white border-red-200 text-red-800",
  info:    "bg-white border-blue-200 text-blue-800",
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium max-w-xs ${TYPE_CLS[t.type]}`}
        >
          {t.type === "success" && <CheckIcon />}
          {t.type === "error"   && <XIcon className="h-4 w-4 shrink-0 text-red-600" />}
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
