"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { electionsApi } from "@/lib/api/elections";
import {
  Election,
  ElectionStatus,
  Candidate,
  CandidateStatus,
  ReviewCandidateDto,
} from "@/lib/types/api";
import {
  X,
  Check,
  CheckCircle,
  AlertTriangle,
  Info,
  Link2,
  UploadCloud,
  Users,
  RefreshCw,
} from "lucide-react";
import styles from "./admin-election.module.css";

const STATUS_CLS: Record<ElectionStatus, string> = {
  [ElectionStatus.DRAFT]:        "status-pending",
  [ElectionStatus.REGISTRATION]: "status-registration",
  [ElectionStatus.UPCOMING]:     "status-upcoming",
  [ElectionStatus.ACTIVE]:       "status-active",
  [ElectionStatus.ENDED]:        "status-ended",
  [ElectionStatus.CANCELLED]:    "status-ended",
};

const STATUS_LABEL: Record<ElectionStatus, string> = {
  [ElectionStatus.DRAFT]:        "Draft",
  [ElectionStatus.REGISTRATION]: "Registration",
  [ElectionStatus.UPCOMING]:     "Upcoming",
  [ElectionStatus.ACTIVE]:       "Open",
  [ElectionStatus.ENDED]:        "Closed",
  [ElectionStatus.CANCELLED]:    "Cancelled",
};

export default function AdminElectionPage() {
  const params = useParams();
  const electionDbId = params.id as string;
  const { isAuthenticated, isAdmin } = useAuthStore();

  // ── Data state ─────────────────────────────────────────────────────────────
  const [election, setElection]       = useState<Election | null>(null);
  const [candidates, setCandidates]   = useState<Candidate[]>([]);
  const [isLoading, setIsLoading]     = useState(true);

  // ── Action loading states ─────────────────────────────────────────────────
  const [reviewingId, setReviewingId]           = useState<string | null>(null);
  const [publishingElection, setPublishingElection] = useState(false);
  const [publishingCandId, setPublishingCandId] = useState<string | null>(null);
  const [computingVoters, setComputingVoters]   = useState(false);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    show: boolean; message: string; type: "success" | "error" | "info"; detail?: string;
  }>({ show: false, message: "", type: "info" });

  const showToast = (
    message: string,
    type: "success" | "error" | "info",
    detail?: string
  ) => setToast({ show: true, message, type, detail });

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 7000);
    return () => clearTimeout(t);
  }, [toast.show]);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [electionData, allCandidates] = await Promise.all([
        electionsApi.getElection(electionDbId),
        electionsApi.getCandidates(electionDbId),   // no status filter = all statuses
      ]);
      setElection(electionData);
      setCandidates(allCandidates);
    } catch (err: any) {
      showToast(err.message || "Failed to load election", "error");
    } finally {
      setIsLoading(false);
    }
  }, [electionDbId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Candidate review ───────────────────────────────────────────────────────
  const handleReview = async (candidateId: string, status: CandidateStatus.APPROVED | CandidateStatus.REJECTED, reason?: string) => {
    setReviewingId(candidateId);
    try {
      const dto: ReviewCandidateDto = { status, rejectionReason: reason };
      await electionsApi.reviewCandidate(electionDbId, candidateId, dto);
      showToast(
        status === CandidateStatus.APPROVED
          ? "Candidate approved and added to the ballot."
          : "Candidate rejected.",
        "success"
      );
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Review failed", "error");
    } finally {
      setReviewingId(null);
    }
  };

  // ── Publish election on-chain ──────────────────────────────────────────────
  const handlePublishElection = async () => {
    setPublishingElection(true);
    try {
      const res = await electionsApi.publishElectionOnChain(electionDbId);
      showToast(
        `Election published on-chain! On-chain ID: ${res.onChainElectionId}`,
        "success",
        `Tx: ${res.txHash}`
      );
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to publish election on-chain", "error");
    } finally {
      setPublishingElection(false);
    }
  };

  // ── Publish approved candidate on-chain ────────────────────────────────────
  const handlePublishCandidate = async (candidateId: string) => {
    setPublishingCandId(candidateId);
    try {
      const res = await electionsApi.publishCandidateOnChain(electionDbId, candidateId);
      showToast(
        `Candidate published on-chain at index ${res.onChainCandidateIndex}.`,
        "success",
        `Tx: ${res.txHash}`
      );
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to publish candidate on-chain", "error");
    } finally {
      setPublishingCandId(null);
    }
  };

  // ── Compute eligible voters ────────────────────────────────────────────────
  const handleComputeVoters = async () => {
    setComputingVoters(true);
    try {
      const res = await electionsApi.computeEligibleVoters(electionDbId);
      showToast(`Voter list computed — ${res.eligibleCount} eligible voters.`, "success");
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to compute voters", "error");
    } finally {
      setComputingVoters(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  if (!isAuthenticated || !isAdmin()) {
    return (
      <div className="container">
        <div className={styles.denied}>
          <h1>Admin access required</h1>
          <p>
            {!isAuthenticated
              ? "Sign in with your INSA account to manage elections."
              : "Your account does not have administrator privileges."}
          </p>
          <Link href="/" className="btn btn-outline btn-sm">Home</Link>
        </div>
      </div>
    );
  }

  if (isLoading || !election) {
    return (
      <div className={styles.loaderContainer}>
        <div className="spinner" />
      </div>
    );
  }

  const pendingCandidates  = candidates.filter((c) => c.status === CandidateStatus.PENDING);
  const approvedCandidates = candidates.filter((c) => c.status === CandidateStatus.APPROVED);
  const rejectedCandidates = candidates.filter((c) => c.status === CandidateStatus.REJECTED);

  const status   = election.status;
  const cfg      = { label: STATUS_LABEL[status], cls: STATUS_CLS[status] };
  const isEnded  = status === ElectionStatus.ENDED;
  const isOnChain = !!election.onChainElectionId;

  return (
    <div className={`container ${styles.page}`}>
      <Link href="/admin" className={styles.backLink}>Admin</Link>

      {/* Header */}
      <header className={`panel panel-pad ${styles.header}`}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{election.title}</h1>
          {election.description && <p className={styles.desc}>{election.description}</p>}
        </div>
        <p className={styles.metaLine}>
          <span className={`status ${cfg.cls}`}>{cfg.label}</span>
          <span style={{ opacity: 0.6, fontSize: "0.85rem" }}>
            {new Date(election.startDate).toLocaleDateString()} –{" "}
            {new Date(election.endDate).toLocaleDateString()}
          </span>
        </p>
      </header>

      {/* On-chain action strip */}
      <div className={`panel panel-pad ${styles.actionsStrip}`}>
        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Blockchain actions</h2>
        <div className={styles.actionBtns}>

          {/* 1. Compute voters */}
          <button
            className="btn btn-outline btn-sm"
            onClick={handleComputeVoters}
            disabled={computingVoters}
            title="Evaluate eligibility rules and build the voter list"
          >
            {computingVoters ? <RefreshCw size={14} className={styles.spin} /> : <Users size={14} />}
            {computingVoters ? "Computing…" : election.votersComputed ? "Recompute voters" : "Compute voters"}
          </button>

          {/* 2. Publish election on-chain */}
          <button
            className={`btn btn-sm ${isOnChain ? "btn-outline" : "btn-primary"}`}
            onClick={handlePublishElection}
            disabled={publishingElection || isOnChain}
            title={
              isOnChain
                ? `Already on-chain (ID: ${election.onChainElectionId})`
                : "Write this election to the Besu blockchain via the server relay wallet"
            }
          >
            {publishingElection ? <RefreshCw size={14} className={styles.spin} /> : <UploadCloud size={14} />}
            {publishingElection
              ? "Publishing…"
              : isOnChain
              ? `✓ On-chain #${election.onChainElectionId}`
              : "Publish election on-chain"}
          </button>
        </div>

        {isOnChain && (
          <p style={{ margin: "0.5rem 0 0", opacity: 0.55, fontSize: "0.78rem" }}>
            On-chain election ID: <code>{election.onChainElectionId}</code>. Publish approved candidates below.
          </p>
        )}
      </div>

      <div className={styles.layout}>
        {/* Left col: Pending + Approved candidates */}
        <div className={styles.leftCol}>

          {/* Pending reviews */}
          <div className="panel panel-pad">
            <h2 className={styles.sectionTitle}>
              Pending review ({pendingCandidates.length})
            </h2>

            {pendingCandidates.length === 0 ? (
              <p className={styles.emptyState}>No registrations waiting for review.</p>
            ) : (
              <div className={styles.list}>
                {pendingCandidates.map((cand) => {
                  const name = cand.employee
                    ? `${cand.employee.firstName} ${cand.employee.lastName}`
                    : "Unknown";
                  return (
                    <div key={cand.id} className={styles.item}>
                      <div className={styles.itemInfo}>
                        <h4 className={styles.itemName}>{name}</h4>
                        {cand.statement && <p className={styles.itemDesc}>{cand.statement}</p>}
                        {cand.slogan && <em className={styles.itemAddress}>&ldquo;{cand.slogan}&rdquo;</em>}
                      </div>
                      <div className={styles.itemActions}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleReview(cand.id, CandidateStatus.APPROVED)}
                          disabled={!!reviewingId || isEnded}
                          title={isEnded ? "Election has ended" : "Approve candidate"}
                        >
                          {reviewingId === cand.id ? <RefreshCw size={13} className={styles.spin} /> : <Check size={14} />}
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReview(cand.id, CandidateStatus.REJECTED)}
                          disabled={!!reviewingId}
                          title="Reject candidate"
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Approved candidates + publish buttons */}
          <div className="panel panel-pad">
            <h2 className={styles.sectionTitle}>
              On the ballot ({approvedCandidates.length})
            </h2>

            {approvedCandidates.length === 0 ? (
              <p className={styles.emptyState}>
                No approved candidates. Approve a pending registration above.
              </p>
            ) : (
              <div className={styles.list}>
                {approvedCandidates.map((cand) => {
                  const name = cand.employee
                    ? `${cand.employee.firstName} ${cand.employee.lastName}`
                    : "Unknown";
                  const isPublished = cand.onChainCandidateIndex !== null;
                  return (
                    <div key={cand.id} className={styles.item}>
                      <div className={styles.itemInfo}>
                        <h4 className={styles.itemName}>{name}</h4>
                        {cand.statement && <p className={styles.itemDesc}>{cand.statement}</p>}
                        {isPublished && (
                          <span style={{ fontSize: "0.75rem", color: "var(--color-success)", fontWeight: 600 }}>
                            ✓ On-chain (index {cand.onChainCandidateIndex})
                          </span>
                        )}
                      </div>
                      <div className={styles.itemActions}>
                        {/* Publish on-chain button — only available when election is on-chain */}
                        {isOnChain && !isPublished && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handlePublishCandidate(cand.id)}
                            disabled={publishingCandId === cand.id}
                            title="Publish this candidate to the blockchain"
                          >
                            {publishingCandId === cand.id
                              ? <RefreshCw size={13} className={styles.spin} />
                              : <Link2 size={13} />}
                            {publishingCandId === cand.id ? "Publishing…" : "Publish on-chain"}
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReview(cand.id, CandidateStatus.REJECTED)}
                          disabled={!!reviewingId}
                          title="Remove from ballot"
                        >
                          <X size={14} />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rejected candidates (collapsed) */}
          {rejectedCandidates.length > 0 && (
            <div className="panel panel-pad">
              <h2 className={styles.sectionTitle} style={{ opacity: 0.5 }}>
                Rejected ({rejectedCandidates.length})
              </h2>
              <div className={styles.list}>
                {rejectedCandidates.map((cand) => {
                  const name = cand.employee
                    ? `${cand.employee.firstName} ${cand.employee.lastName}`
                    : "Unknown";
                  return (
                    <div key={cand.id} className={styles.item} style={{ opacity: 0.55 }}>
                      <div className={styles.itemInfo}>
                        <h4 className={styles.itemName}>{name}</h4>
                        {cand.rejectionReason && <p className={styles.itemDesc}>{cand.rejectionReason}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right col: Election info / quick stats */}
        <div className={styles.rightCol}>
          <div className={`panel panel-pad ${styles.formBlock}`}>
            <h3 className={styles.formTitle}>Election info</h3>

            <dl style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <dt style={{ fontSize: "0.78rem", opacity: 0.55, marginBottom: "0.2rem" }}>Type</dt>
                <dd style={{ fontWeight: 600 }}>{election.electionType.replace("_", " ")}</dd>
              </div>
              <div>
                <dt style={{ fontSize: "0.78rem", opacity: 0.55, marginBottom: "0.2rem" }}>Registration deadline</dt>
                <dd>{election.registrationDeadline
                  ? new Date(election.registrationDeadline).toLocaleString()
                  : "—"}</dd>
              </div>
              <div>
                <dt style={{ fontSize: "0.78rem", opacity: 0.55, marginBottom: "0.2rem" }}>Voting opens</dt>
                <dd>{new Date(election.startDate).toLocaleString()}</dd>
              </div>
              <div>
                <dt style={{ fontSize: "0.78rem", opacity: 0.55, marginBottom: "0.2rem" }}>Voting closes</dt>
                <dd>{new Date(election.endDate).toLocaleString()}</dd>
              </div>
              <div>
                <dt style={{ fontSize: "0.78rem", opacity: 0.55, marginBottom: "0.2rem" }}>Max candidates</dt>
                <dd>{election.maxCandidates}</dd>
              </div>
              <div>
                <dt style={{ fontSize: "0.78rem", opacity: 0.55, marginBottom: "0.2rem" }}>Voters computed</dt>
                <dd>{election.votersComputed ? "✓ Yes" : "Not yet"}</dd>
              </div>
            </dl>

            <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Link
                href={`/elections/${election.id}`}
                className="btn btn-outline btn-sm"
                target="_blank"
              >
                View public page
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast animate-fade-in toast-${toast.type}`}>
            {toast.type === "success" && <CheckCircle size={18} style={{ color: "var(--color-success)" }} />}
            {toast.type === "error"   && <AlertTriangle size={18} style={{ color: "var(--color-danger)" }} />}
            {toast.type === "info"    && <Info size={18} style={{ color: "var(--color-accent)" }} />}
            <div>
              <span>{toast.message}</span>
              {toast.detail && (
                <div style={{ fontSize: "0.75rem", opacity: 0.65, marginTop: "0.2rem" }}>
                  {toast.detail}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
