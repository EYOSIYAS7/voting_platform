'use client';

import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { ShieldCheck, Link2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './WalletBindingModal.module.css';

interface WalletBindingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletBindingModal({ isOpen, onClose }: WalletBindingModalProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { employee, walletBinding, bindWallet, isLoading } = useAuthStore();
  const [bindError, setBindError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleBind = async () => {
    if (!address) {
      setBindError('Please connect your Web3 wallet first.');
      return;
    }

    setBindError(null);
    setSuccessMsg(null);

    try {
      await bindWallet(address, async ({ message }) => {
        return await signMessageAsync({ message });
      });
      setSuccessMsg('Wallet identity successfully bound to your INSA account!');
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setBindError(err.message || 'Failed to bind wallet. Please try again.');
    }
  };

  const isAlreadyBoundToThisAddress =
    walletBinding?.address &&
    address &&
    walletBinding.address.toLowerCase() === address.toLowerCase();

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.topAccent} />

        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close dialog"
          type="button"
        >
          <X size={18} />
        </button>

        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <Link2 size={26} />
          </div>
          <h2 className={styles.title}>Cryptographic Wallet Binding</h2>
          <p className={styles.subtitle}>
            Link your Ethereum wallet address to your INSA employee identity via Sign-In with Ethereum (SIWE).
          </p>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Employee</span>
            <span className={styles.infoValue}>
              {employee ? `${employee.firstName} ${employee.lastName}` : 'Signed-in User'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Employee ID</span>
            <span className={styles.infoValue}>{employee?.employeeId || '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Connected Wallet</span>
            <span className={styles.infoValue}>
              {address ? truncateAddress(address) : 'Not Connected'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Binding Status</span>
            {walletBinding ? (
              <span className={styles.badgeBound}>
                <ShieldCheck size={13} />
                Bound ({truncateAddress(walletBinding.address)})
              </span>
            ) : (
              <span className={styles.badgeUnbound}>Unbound</span>
            )}
          </div>
        </div>

        {bindError && (
          <div className={styles.errorBox} role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{bindError}</span>
          </div>
        )}

        {successMsg && (
          <div className={styles.successBox} role="alert">
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {isAlreadyBoundToThisAddress ? (
          <div className={styles.successBox}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>Your connected wallet is already bound and active.</span>
          </div>
        ) : (
          <button
            type="button"
            className={styles.bindBtn}
            onClick={handleBind}
            disabled={isLoading || !isConnected || !address}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                <span>Signing Challenge...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Sign Challenge & Bind Wallet</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
