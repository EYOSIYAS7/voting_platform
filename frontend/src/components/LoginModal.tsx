'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, X, AlertCircle } from 'lucide-react';
import styles from './LoginModal.module.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      clearError();
    }
  }, [isOpen, clearError]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      await login({ email, password });
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      // Error handled by store state
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    clearError();
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.topAccent} />

        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close login dialog"
          type="button"
        >
          <X size={18} />
        </button>

        <div className={styles.header}>
          <div className={styles.shieldWrap}>
            <ShieldCheck size={28} />
          </div>
          <h2 className={styles.title}>INSA Sovereign Sign-In</h2>
          <p className={styles.subtitle}>
            Information Network Security Administration • E-Voting System
          </p>
        </div>

        {error && (
          <div className={styles.errorBox} role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="insa-email">
              Organizational Email
            </label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>
                <Mail size={16} />
              </span>
              <input
                id="insa-email"
                type="email"
                className={styles.input}
                placeholder="name@insa.gov.et"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="insa-password">
              Password
            </label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>
                <Lock size={16} />
              </span>
              <input
                id="insa-password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.togglePassBtn}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to INSA Portal</span>
            )}
          </button>
        </form>

        <div className={styles.demoBox}>
          <span className={styles.demoTitle}>Quick Demo Access</span>
          <button
            type="button"
            className={styles.demoBtn}
            onClick={() => handleFillDemo('admin@insa.gov.et', 'Admin@123456')}
          >
            <span>👑 System Administrator</span>
            <code>admin@insa.gov.et</code>
          </button>
        </div>
      </div>
    </div>
  );
}
