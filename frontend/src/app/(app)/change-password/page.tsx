'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { authApi } from '@/lib/api/auth';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import styles from './change-password.module.css';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { employee, user, fetchProfile } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from your current temporary password.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setIsSuccess(true);
      await fetchProfile().catch(() => {});
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please verify your current credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Allows employee to proceed with their existing credentials as requested
    router.push('/dashboard');
  };

  const displayName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : user?.email || 'INSA Personnel';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.topAccent} />

        <div className={styles.header}>
          <div className={styles.shieldWrap}>
            <KeyRound size={26} />
          </div>
          <h1 className={styles.title}>Update Password</h1>
          <p className={styles.subtitle}>
            Welcome, <strong>{displayName}</strong>. Your account was provisioned with temporary credentials.
            You may set your personal password below or continue with your current credentials.
          </p>
        </div>

        {error && (
          <div className={styles.errorBox} role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {isSuccess && (
          <div className={styles.successBox} role="status">
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>Password updated successfully! Redirecting to your dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="curr-pass">
              Current / Temporary Password *
            </label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>
                <Lock size={15} />
              </span>
              <input
                id="curr-pass"
                type={showCurrent ? 'text' : 'password'}
                className={`form-input ${styles.input}`}
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.togglePassBtn}
                onClick={() => setShowCurrent((p) => !p)}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-pass">
              New Personal Password *
            </label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>
                <Lock size={15} />
              </span>
              <input
                id="new-pass"
                type={showNew ? 'text' : 'password'}
                className={`form-input ${styles.input}`}
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.togglePassBtn}
                onClick={() => setShowNew((p) => !p)}
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="conf-pass">
              Confirm New Password *
            </label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>
                <Lock size={15} />
              </span>
              <input
                id="conf-pass"
                type={showConfirm ? 'text' : 'password'}
                className={`form-input ${styles.input}`}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.togglePassBtn}
                onClick={() => setShowConfirm((p) => !p)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className={styles.btnRow}>
            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={isLoading || isSuccess}
            >
              {isLoading ? 'Updating Password...' : 'Save New Password & Continue'}
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              className={styles.skipBtn}
              onClick={handleSkip}
            >
              Continue using current credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

