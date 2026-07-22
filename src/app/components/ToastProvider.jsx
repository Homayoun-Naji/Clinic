"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
} from "react";
import Toast from "./Toast";

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);
  const recentToasts = useRef(new Map());

  const showToast = useCallback((type = "success", message, options = {}) => {
    const {
      duration = 5000,
      preventDuplicate = true,
      duplicateWindow = 3000,
    } = options;

    // Prevent duplicate toasts within a time window
    if (preventDuplicate) {
      const key = `${type}:${message}`;
      const now = Date.now();
      const lastShown = recentToasts.current.get(key);

      if (lastShown && now - lastShown < duplicateWindow) {
        return; // Skip duplicate
      }
      recentToasts.current.set(key, now);

      // Clean up old entries
      setTimeout(() => {
        recentToasts.current.delete(key);
      }, duplicateWindow);
    }

    const id = ++toastIdCounter.current;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={removeToast}
              duration={toast.duration}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
