"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  useAllElectionIds,
  useIsAdmin,
  useSuperAdmin,
  useCreateElection,
  useGrantAdmin,
  useContractAddress,
} from "@/lib/hooks/useContract";
import { VOTING_PLATFORM_ABI, Election } from "@/lib/abi/votingPlatform";
import { useReadContracts } from "wagmi";
import {
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  BarChart3,
  Calendar,
  Lock,
  ArrowRight,
  X,
  PlusCircle,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const contractAddress = useContractAddress();

  // Access control queries
  const { data: isAdmin, isLoading: isRoleLoading } = useIsAdmin(address);
  const { data: superAdminAddress, isLoading: isSuperAdminLoading } = useSuperAdmin();
  const isSuperAdmin = !!(
    address &&
    superAdminAddress &&
    address.toLowerCase() === (superAdminAddress as string).toLowerCase()
  );

  // Elections queries
  const {
    data: electionIdsRaw,
    isLoading: isIdsLoading,
    refetch: refetchIds,
  } = useAllElectionIds();
  const electionIds = electionIdsRaw as readonly bigint[] | undefined;

  // Prepare batch read for election details
  const electionQueries = useMemo(() => {
    if (!electionIds) return [];
    return electionIds.map((id) => ({
      address: contractAddress,
      abi: VOTING_PLATFORM_ABI,
      functionName: "getElection",
      args: [id],
    }));
  }, [electionIds, contractAddress]);

  const {
    data: electionsData,
    isLoading: isDetailsLoading,
    refetch: refetchDetails,
  } = useReadContracts({
    contracts: electionQueries,
    query: { enabled: electionQueries.length > 0 },
  });

  // Local state for modal toggling
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for creating election
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [regStart, setRegStart] = useState("");
  const [regEnd, setRegEnd] = useState("");
  const [voteStart, setVoteStart] = useState("");
  const [voteEnd, setVoteEnd] = useState("");

  // Form states for granting admin
  const [newAdminAddress, setNewAdminAddress] = useState("");

  // Mutations
  const { writeContract: createElection, isPending: isCreatePending } =
    useCreateElection();
  const { writeContract: grantAdmin, isPending: isGrantPending } =
    useGrantAdmin();

  // Local state for toast notification
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    show: false,
    message: "",
    type: "info",
  });

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Parse and status elections
  const electionsList = useMemo(() => {
    if (!electionsData) return [];

    const now = Math.floor(Date.now() / 1000);

    return electionsData
      .map((res: any) => {
        const val = res.result || res;
        if (!val || !val.exists) return null;

        const election: Election = {
          id: val.id,
          title: val.title,
          description: val.description,
          imageUrl: val.imageUrl,
          registrationStart: val.registrationStart,
          registrationEnd: val.registrationEnd,
          votingStart: val.votingStart,
          votingEnd: val.votingEnd,
          totalVotes: val.totalVotes,
          exists: val.exists,
        };

        // Determine status
        const rStart = Number(election.registrationStart);
        const rEnd = Number(election.registrationEnd);
        const vStart = Number(election.votingStart);
        const vEnd = Number(election.votingEnd);

        let status: Election["status"] = "Ended";
        if (now < rStart) status = "Pending";
        else if (now <= rEnd) status = "Registration";
        else if (now < vStart) status = "Upcoming";
        else if (now <= vEnd) status = "Active";

        return { ...election, status };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }, [electionsData]);

  // Compute analytics
  const stats = useMemo(() => {
    let totalVotes = 0n;
    let activeCount = 0;
    let upcomingCount = 0;
    let endedCount = 0;

    electionsList.forEach((e) => {
      totalVotes += e.totalVotes;
      if (e.status === "Active") activeCount++;
      else if (e.status === "Upcoming" || e.status === "Registration")
        upcomingCount++;
      else if (e.status === "Ended") endedCount++;
    });

    return {
      totalElections: electionsList.length,
      activeCount,
      upcomingCount,
      endedCount,
      totalVotes,
    };
  }, [electionsList]);

  // Form submit handlers
  const handleCreateElection = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    // Convert datetimes to unix seconds
    const rStartUnix = Math.floor(new Date(regStart).getTime() / 1000);
    const rEndUnix = Math.floor(new Date(regEnd).getTime() / 1000);
    const vStartUnix = Math.floor(new Date(voteStart).getTime() / 1000);
    const vEndUnix = Math.floor(new Date(voteEnd).getTime() / 1000);

    const now = Math.floor(Date.now() / 1000);

    // Validations
    if (rEndUnix <= rStartUnix) {
      showToast("Registration end must be after registration start", "error");
      return;
    }
    if (vStartUnix < rEndUnix) {
      showToast(
        "Voting start must be after or equal to registration end",
        "error",
      );
      return;
    }
    if (vEndUnix <= vStartUnix) {
      showToast("Voting end must be after voting start", "error");
      return;
    }
    if (vEndUnix <= now) {
      showToast("Voting end must be in the future", "error");
      return;
    }

    createElection(
      {
        address: contractAddress,
        abi: VOTING_PLATFORM_ABI,
        functionName: "createElection",
        args: [
          title,
          description,
          imageUrl,
          BigInt(rStartUnix),
          BigInt(rEndUnix),
          BigInt(vStartUnix),
          BigInt(vEndUnix),
        ],
      },
      {
        onSuccess: () => {
          showToast("Election created successfully!", "success");
          setIsCreateModalOpen(false);
          // Clear inputs
          setTitle("");
          setDescription("");
          setImageUrl("");
          setRegStart("");
          setRegEnd("");
          setVoteStart("");
          setVoteEnd("");
          // Refresh list
          refetchIds();
          refetchDetails();
        },
        onError: (err: any) => {
          console.error(err);
          const msg =
            err.shortMessage || err.message || "Failed to create election";
          showToast(msg, "error");
        },
      },
    );
  };

  const handleGrantAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminAddress.trim()) {
      showToast("Admin address is required", "error");
      return;
    }

    grantAdmin(
      {
        address: contractAddress,
        abi: VOTING_PLATFORM_ABI,
        functionName: "grantAdmin",
        args: [newAdminAddress as `0x${string}`],
      },
      {
        onSuccess: () => {
          showToast(`Admin role granted to ${newAdminAddress}`, "success");
          setNewAdminAddress("");
        },
        onError: (err: any) => {
          console.error(err);
          const msg =
            err.shortMessage ||
            err.message ||
            "Failed to grant admin privileges";
          showToast(msg, "error");
        },
      },
    );
  };

  const isPageLoading = isRoleLoading || isSuperAdminLoading || (isIdsLoading && !!electionIds);

  if (isPageLoading) {
    return (
      <div className={styles.loaderContainer}>
        <div className="spinner" />
      </div>
    );
  }

  // Access Control: Block if not admin
  if (!isConnected || !isAdmin) {
    return (
      <div className="container">
        <div className={`card ${styles.deniedCard} animate-fade-in`}>
          <div className={styles.deniedIcon}>
            <Lock size={36} />
          </div>
          <h2 className={styles.deniedTitle}>Access Denied</h2>
          <p className={styles.deniedDesc}>
            {!isConnected
              ? "Please connect your Web3 wallet in the top bar to verify admin permissions."
              : "Your connected wallet is not authorized as an administrator of this voting platform."}
          </p>
          {!isConnected ? (
            <div
              style={{
                marginTop: "0.5rem",
                color: "var(--color-text-3)",
                fontSize: "0.85rem",
              }}
            >
              Awaiting connection...
            </div>
          ) : (
            <Link href="/" className="btn btn-outline btn-sm">
              Return Home
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      {/* Dashboard Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.desc}>
            Manage voting events, approve candidates, and monitor blockchain
            metrics.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={16} />
          New Election
        </button>
      </div>

      {/* Analytics Row */}
      <div className={styles.statsRow}>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIcon}>
            <Calendar size={20} />
          </div>
          <div className={styles.statDetails}>
            <span className={styles.statVal}>{stats.totalElections}</span>
            <span className={styles.statLabel}>Elections</span>
          </div>
        </div>

        <div className={`card ${styles.statCard}`}>
          <div
            className={styles.statIcon}
            style={{
              background: "rgba(34,197,94,0.1)",
              color: "var(--color-success)",
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div className={styles.statDetails}>
            <span className={styles.statVal}>{stats.activeCount}</span>
            <span className={styles.statLabel}>Active (Live)</span>
          </div>
        </div>

        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIcon}>
            <Users size={20} />
          </div>
          <div className={styles.statDetails}>
            <span className={styles.statVal}>{stats.upcomingCount}</span>
            <span className={styles.statLabel}>Registration/Upc.</span>
          </div>
        </div>

        <div className={`card ${styles.statCard}`}>
          <div
            className={styles.statIcon}
            style={{
              background: "rgba(245,158,11,0.1)",
              color: "var(--color-warning)",
            }}
          >
            <BarChart3 size={20} />
          </div>
          <div className={styles.statDetails}>
            <span className={styles.statVal}>
              {Number(stats.totalVotes).toLocaleString()}
            </span>
            <span className={styles.statLabel}>Total Votes Cast</span>
          </div>
        </div>
      </div>

      {/* Dashboard Tables / Actions */}
      <div className={styles.adminLayout}>
        {/* Panel: Election Management */}
        <div className={`card ${styles.panelCard}`}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Manage Elections</h3>
          </div>

          <div className={styles.tableWrapper}>
            {electionsList.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem 0",
                  color: "var(--color-text-3)",
                }}
              >
                No elections created yet. Click "New Election" to scaffold your
                first voting event.
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Election Title</th>
                    <th>Status</th>
                    <th>Votes Cast</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {electionsList.map((election) => (
                    <tr key={election.id.toString()}>
                      <td className={styles.electionNameCol}>
                        {election.title}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            election.status === "Active"
                              ? "badge-active"
                              : election.status === "Registration"
                                ? "badge-registration"
                                : election.status === "Upcoming"
                                  ? "badge-upcoming"
                                  : election.status === "Pending"
                                    ? "badge-pending"
                                    : "badge-ended"
                          }`}
                        >
                          {election.status === "Active"
                            ? "Live"
                            : election.status === "Registration"
                              ? "Open Reg."
                              : election.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {Number(election.totalVotes).toLocaleString()}
                      </td>
                      <td>
                        <Link
                          href={`/admin/elections/${election.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          Manage
                          <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel: Super Admin Rights */}
        {isSuperAdmin && (
          <div className={`card ${styles.panelCard}`}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Super Admin Controls</h3>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-2)" }}>
                As the platform deployer, you can delegate administrator access
                to other wallet addresses. Granted admins can create elections
                and approve candidates, but only you can grant/revoke roles.
              </p>
              <form onSubmit={handleGrantAdmin} className={styles.grantForm}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="0x wallet address"
                  value={newAdminAddress}
                  onChange={(e) => setNewAdminAddress(e.target.value)}
                  disabled={isGrantPending}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={isGrantPending}
                >
                  {isGrantPending ? "Granting..." : "Grant Admin"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ─── Create Election Modal ─────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal animate-fade-in-up">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.03em' }}>
                Create new election
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-3)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-2)",
                marginBottom: "1.5rem",
              }}
            >
              Set up a structured election lifecycle. Timestamps determine
              candidate sign-up windows and ballot casting periods,
              automatically enforced on-chain.
            </p>

            <form onSubmit={handleCreateElection}>
              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">Election Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Presidential Election 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  placeholder="Summarize the purpose and guidelines of this voting event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Cover Image URL (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/banner.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--color-border)',
                  padding: '1rem 0 0.5rem',
                  fontWeight: 500,
                  fontSize: '0.72rem',
                  color: 'var(--color-text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                Time-gating schedule
              </div>

              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label">
                    Candidate Registration Opens *
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={regStart}
                    onChange={(e) => setRegStart(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Candidate Registration Closes *
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={regEnd}
                    onChange={(e) => setRegEnd(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Voting Opens *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={voteStart}
                    onChange={(e) => setVoteStart(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Voting Closes *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={voteEnd}
                    onChange={(e) => setVoteEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreatePending}
                >
                  {isCreatePending ? "Deploying..." : "Deploy Election"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Toast Container ────────────────────────────────────────────── */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast animate-fade-in toast-${toast.type}`}>
            {toast.type === "success" && (
              <CheckCircle
                size={18}
                style={{ color: "var(--color-success)" }}
              />
            )}
            {toast.type === "error" && (
              <AlertTriangle
                size={18}
                style={{ color: "var(--color-danger)" }}
              />
            )}
            {toast.type === "info" && (
              <Info size={18} style={{ color: "var(--color-primary)" }} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
