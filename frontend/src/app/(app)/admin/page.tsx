"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { electionsApi } from "@/lib/api/elections";
import {
  Election,
  ElectionStatus,
  CreateElectionDto,
  ElectionType,
} from "@/lib/types/api";
import { Plus, X, CheckCircle, AlertTriangle, Info } from "lucide-react";
import styles from "./admin.module.css";

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

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin, user } = useAuthStore();

  // ── Data ───────────────────────────────────────────────────────────────────
  const [elections, setElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadElections = () => {
    setIsLoading(true);
    electionsApi.getElections()
      .then(setElections)
      .catch(() => showToast("Failed to load elections", "error"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadElections(); }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    return {
      total:        elections.length,
      active:       elections.filter((e) => e.status === ElectionStatus.ACTIVE).length,
      upcoming:     elections.filter((e) => e.status === ElectionStatus.UPCOMING || e.status === ElectionStatus.REGISTRATION).length,
      ended:        elections.filter((e) => e.status === ElectionStatus.ENDED).length,
    };
  }, [elections]);

  // ── Create election modal ──────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [regDeadline, setRegDeadline] = useState("");
  const [maxCandidates, setMaxCandidates] = useState("10");

  const resetCreateForm = () => {
    setTitle(""); setDescription(""); setStartDate("");
    setEndDate(""); setRegDeadline(""); setMaxCandidates("10");
  };

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    show: boolean; message: string; type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  const showToast = (message: string, type: "success" | "error" | "info") =>
    setToast({ show: true, message, type });

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 5000);
    return () => clearTimeout(t);
  }, [toast.show]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { showToast("Title is required", "error"); return; }
    if (!startDate || !endDate) { showToast("Start and end dates are required", "error"); return; }
    if (new Date(endDate) <= new Date(startDate)) {
      showToast("End date must be after start date", "error"); return;
    }

    setIsCreating(true);
    try {
      const dto: CreateElectionDto = {
        title:                title.trim(),
        description:          description.trim() || undefined,
        electionType:         ElectionType.GENERAL,
        organizationId:       user?.scopes?.[0]?.orgUnitId ?? "",   // fallback; admin sets org
        startDate:            new Date(startDate).toISOString(),
        endDate:              new Date(endDate).toISOString(),
        registrationDeadline: regDeadline ? new Date(regDeadline).toISOString() : undefined,
        maxCandidates:        parseInt(maxCandidates, 10) || 10,
      };
      await electionsApi.createElection(dto);
      showToast("Election created successfully!", "success");
      setIsCreateModalOpen(false);
      resetCreateForm();
      loadElections();
    } catch (err: any) {
      showToast(err.message || "Failed to create election", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // ── Access guard ───────────────────────────────────────────────────────────
  if (!isAuthenticated || !isAdmin()) {
    return (
      <div className="container">
        <div className={styles.denied}>
          <h1 className={styles.deniedTitle}>Admin access required</h1>
          <p className={styles.deniedDesc}>
            {!isAuthenticated
              ? "Sign in with your INSA account to access the admin panel."
              : "Your account does not have administrator privileges."}
          </p>
          <Link href="/" className="btn btn-outline btn-sm">Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Admin</h1>
          <p>Create elections, review candidates, and manage the ballot.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} />
          New election
        </button>
      </div>

      {/* Stats row */}
      <div className="stat-row">
        <div className="stat"><span>Elections</span><strong>{isLoading ? "—" : stats.total}</strong></div>
        <div className="stat"><span>Open</span><strong>{isLoading ? "—" : stats.active}</strong></div>
        <div className="stat"><span>Upcoming</span><strong>{isLoading ? "—" : stats.upcoming}</strong></div>
        <div className="stat"><span>Closed</span><strong>{isLoading ? "—" : stats.ended}</strong></div>
      </div>

      {/* Elections table */}
      <div className={styles.adminLayout}>
        <section className={`panel ${styles.tablePanel}`}>
          <h2 className={styles.panelTitle}>Elections</h2>

          <div className={styles.tableWrapper}>
            {isLoading ? (
              <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
                <div className="spinner" />
              </div>
            ) : elections.length === 0 ? (
              <div className="empty-state">
                <h3>No elections yet</h3>
                <p>Create one to open registration and voting windows.</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Voting window</th>
                    <th>On-chain</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {elections.map((election) => (
                    <tr key={election.id}>
                      <td className={styles.electionNameCol}>{election.title}</td>
                      <td>
                        <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>
                          {election.electionType.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${STATUS_CLS[election.status]}`}>
                          {STATUS_LABEL[election.status]}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                        {new Date(election.startDate).toLocaleDateString()} –{" "}
                        {new Date(election.endDate).toLocaleDateString()}
                      </td>
                      <td>
                        {election.onChainElectionId ? (
                          <span
                            title={`On-chain ID: ${election.onChainElectionId}`}
                            style={{ color: "var(--color-success)", fontSize: "0.8rem", fontWeight: 600 }}
                          >
                            ✓ Published
                          </span>
                        ) : (
                          <span style={{ opacity: 0.45, fontSize: "0.8rem" }}>Pending</span>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/admin/elections/${election.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* ─── Create Election Modal ─────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className={styles.modalHead}>
              <h3>New election</h3>
              <button
                type="button"
                onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}
                className={styles.iconClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className={styles.modalLead}>
              Fill in the election details. After creating, go to the election&apos;s
              manage page to add eligibility rules, review candidates, and publish
              on-chain.
            </p>

            <form onSubmit={handleCreateElection}>
              <div className="form-group" style={{ marginBottom: "1.1rem" }}>
                <label className="form-label" htmlFor="el-title">Title *</label>
                <input
                  id="el-title"
                  type="text"
                  className="form-input"
                  placeholder="Election title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.1rem" }}>
                <label className="form-label" htmlFor="el-desc">Description</label>
                <textarea
                  id="el-desc"
                  className="form-input"
                  placeholder="What this vote is about"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <p className={styles.scheduleLabel}>Schedule</p>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label" htmlFor="el-reg-deadline">Registration deadline</label>
                  <input
                    id="el-reg-deadline"
                    type="datetime-local"
                    className="form-input"
                    value={regDeadline}
                    onChange={(e) => setRegDeadline(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="el-start">Voting opens *</label>
                  <input
                    id="el-start"
                    type="datetime-local"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="el-end">Voting closes *</label>
                  <input
                    id="el-end"
                    type="datetime-local"
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="el-max">Max candidates</label>
                  <input
                    id="el-max"
                    type="number"
                    className="form-input"
                    min="1"
                    max="100"
                    value={maxCandidates}
                    onChange={(e) => setMaxCandidates(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                  {isCreating ? "Creating…" : "Create election"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast animate-fade-in toast-${toast.type}`}>
            {toast.type === "success" && <CheckCircle size={18} style={{ color: "var(--color-success)" }} />}
            {toast.type === "error"   && <AlertTriangle size={18} style={{ color: "var(--color-danger)" }} />}
            {toast.type === "info"    && <Info size={18} style={{ color: "var(--color-accent)" }} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
