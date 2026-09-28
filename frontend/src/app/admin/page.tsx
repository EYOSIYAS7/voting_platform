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
  X,
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
        <div className={styles.denied}>
          <h1 className={styles.deniedTitle}>Admin access required</h1>
          <p className={styles.deniedDesc}>
            {!isConnected
              ? "Connect a wallet in the header to check whether you can administer elections."
              : "This wallet is not an administrator."}
          </p>
          {isConnected && (
            <Link href="/" className="btn btn-outline btn-sm">
              Home
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Admin</h1>
          <p>Create elections, review candidates, and grant administrators.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={16} />
          New election
        </button>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span>Elections</span>
          <strong>{stats.totalElections}</strong>
        </div>
        <div className="stat">
          <span>Open</span>
          <strong>{stats.activeCount}</strong>
        </div>
        <div className="stat">
          <span>Upcoming</span>
          <strong>{stats.upcomingCount}</strong>
        </div>
        <div className="stat">
          <span>Votes recorded</span>
          <strong>{Number(stats.totalVotes).toLocaleString()}</strong>
        </div>
      </div>

      <div className={styles.adminLayout}>
        <section className={`panel ${styles.tablePanel}`}>
          <h2 className={styles.panelTitle}>Elections</h2>

          <div className={styles.tableWrapper}>
            {electionsList.length === 0 ? (
              <div className="empty-state">
                <h3>No elections yet</h3>
                <p>Create one to open registration and voting windows.</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Votes</th>
                    <th></th>
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
                          className={
                            election.status === "Active"
                              ? "status-active"
                              : election.status === "Registration"
                                ? "status-registration"
                                : election.status === "Upcoming"
                                  ? "status-upcoming"
                                  : election.status === "Pending"
                                    ? "status-pending"
                                    : "status-ended"
                          }
                        >
                          {election.status === "Active"
                            ? "Open"
                            : election.status === "Registration"
                              ? "Registration"
                              : election.status}
                        </span>
                      </td>
                      <td>
                        {Number(election.totalVotes).toLocaleString()}
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

        {isSuperAdmin && (
          <section className={`panel panel-pad ${styles.grantSection}`}>
            <h2 className={styles.panelTitle}>Grant administrator</h2>
            <p className={styles.grantCopy}>
              Super admins can add wallets that create elections and approve candidates.
              Only you can grant or revoke that role.
            </p>
            <form onSubmit={handleGrantAdmin} className={styles.grantForm}>
              <label htmlFor="new-admin" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                Wallet address
              </label>
              <input
                id="new-admin"
                type="text"
                className="form-input"
                placeholder="0x…"
                value={newAdminAddress}
                onChange={(e) => setNewAdminAddress(e.target.value)}
                disabled={isGrantPending}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isGrantPending}
              >
                {isGrantPending ? "Granting…" : "Grant"}
              </button>
            </form>
          </section>
        )}
      </div>

      {/* ─── Create Election Modal ─────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className={styles.modalHead}>
              <h3>New election</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className={styles.iconClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className={styles.modalLead}>
              Set registration and voting windows. The contract enforces those times.
            </p>

            <form onSubmit={handleCreateElection}>
              <div className="form-group" style={{ marginBottom: "1.1rem" }}>
                <label className="form-label" htmlFor="el-title">Title</label>
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

              <div className="form-group" style={{ marginBottom: "1.35rem" }}>
                <label className="form-label" htmlFor="el-img">Cover image URL (optional)</label>
                <input
                  id="el-img"
                  type="url"
                  className="form-input"
                  placeholder="https://"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <p className={styles.scheduleLabel}>Schedule</p>

              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label">Registration opens</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={regStart}
                    onChange={(e) => setRegStart(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Registration closes</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={regEnd}
                    onChange={(e) => setRegEnd(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Voting opens</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={voteStart}
                    onChange={(e) => setVoteStart(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Voting closes</label>
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
                  {isCreatePending ? "Creating…" : "Create election"}
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
              <Info size={18} style={{ color: "var(--color-accent)" }} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
