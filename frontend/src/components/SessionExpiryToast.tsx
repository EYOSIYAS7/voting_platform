'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export function SessionExpiryToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('Your session has expired. Please sign in again.');

  useEffect(() => {
    const handleExpired = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      if (customEvent.detail?.message) {
        setMessage(customEvent.detail.message);
      }
      setVisible(true);
    };

    window.addEventListener('insa:session-expired', handleExpired);
    return () => window.removeEventListener('insa:session-expired', handleExpired);
  }, []);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className="toast toast-error animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertCircle size={18} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <span>{message}</span>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-2)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Dismiss notification"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

