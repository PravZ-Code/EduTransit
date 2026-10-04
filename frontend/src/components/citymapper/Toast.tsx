"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "warning" | "info" | "error";

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (title: string, description?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (title: string, description?: string, type: ToastType = "success") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "#00C281";
      case "warning":
        return "#FF8A00";
      case "error":
        return "#E8453C";
      case "info":
      default:
        return "#2B5BFF";
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-[#00C281] shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-[#FF8A00] shrink-0" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-[#E8453C] shrink-0" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-[#4D7BFF] shrink-0" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container floating at bottom-center or top-center */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none select-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              backgroundColor: "#15171F",
              borderColor: getBorderColor(toast.type),
            }}
            className="pointer-events-auto p-3.5 rounded-[14px] border shadow-2xl flex items-start gap-3 backdrop-blur-md animate-toastIn text-left"
          >
            <div className="mt-0.5">{getIcon(toast.type)}</div>
            <div className="flex-1 min-w-0">
              <span className="font-extrabold text-[13px] text-[#ECEEF3] tracking-tight block truncate">
                {toast.title}
              </span>
              {toast.description && (
                <span className="text-[11px] text-[#98A0AE] block mt-0.5 leading-relaxed">
                  {toast.description}
                </span>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#646C7A] hover:text-[#ECEEF3] p-0.5 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
