import React, { createContext, useState, useCallback } from 'react';
import { Toast, ToastType } from '../types';

export interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Portal Container */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999,
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => {
          let bg = 'var(--color-surface)';
          let border = '1px solid var(--color-border)';
          let text = 'var(--color-text-primary)';
          let indicator = '🔵';

          if (toast.type === 'success') {
            bg = '#F0FDF4';
            border = '1px solid rgba(34, 197, 94, 0.2)';
            text = '#15803D';
            indicator = '🟢';
          } else if (toast.type === 'warning') {
            bg = '#FFFBEB';
            border = '1px solid rgba(245, 158, 11, 0.2)';
            text = '#B45309';
            indicator = '🟡';
          } else if (toast.type === 'error') {
            bg = '#FEF2F2';
            border = '1px solid rgba(239, 68, 68, 0.2)';
            text = '#B91C1C';
            indicator = '🔴';
          } else if (toast.type === 'info') {
            bg = '#EFF6FF';
            border = '1px solid rgba(37, 99, 235, 0.2)';
            text = '#1D4ED8';
            indicator = '🔵';
          }

          return (
            <div
              key={toast.id}
              className="medx-slide-in shadow-md"
              style={{
                backgroundColor: bg,
                border: border,
                color: text,
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '280px',
                maxWidth: '420px',
                pointerEvents: 'auto',
                cursor: 'pointer'
              }}
              onClick={() => removeToast(toast.id)}
            >
              <span>{indicator}</span>
              <span style={{ flex: 1 }}>{toast.message}</span>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  opacity: 0.6,
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
