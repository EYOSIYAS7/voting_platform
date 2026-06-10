"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  useElection,
  useElectionStatus,
  useCandidateIds,
  useIsAdmin,
  useApproveCandidate,
  useRejectCandidate,
  useAddCandidate,
  useContractAddress,
} from "@/lib/hooks/useContract";
import {
  VOTING_PLATFORM_ABI,
  Election,
  Candidate,
} from "@/lib/abi/votingPlatform";
import { useReadContracts } from "wagmi";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Check,
  X,
  Lock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
} from "lucide-react";
import styles from "./admin-election.module.css";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  Active: { label: "Live", cls: "badge-active" },
  Upcoming: { label: "Upcoming", cls: "badge-upcoming" },
  Registration: { label: "Open Reg.", cls: "badge-registration" },
  Pending: { label: "Pending", cls: "badge-pending" },
  Ended: { label: "Ended", cls: "badge-ended" },
};

export default function AdminElectionPage() {
  const params = useParams();
  const electionId = BigInt(params.id as string);

  const { address, isConnected } = useAccount();
  const contractAddress = useContractAddress();

  // Queries
  const { data: isAdmin, isLoading: isRoleLoading } = useIsAdmin(address);
  const {
    data: electionRaw,
    isLoading: isElectionLoading,
    refetch: refetchElection,
  } = useElection(electionId);
  const { data: statusRaw, refetch: refetchStatus } =
    useElectionStatus(electionId);
  const {
    data: candidateIdsRaw,
    isLoading: isIdsLoading,
    refetch: refetchIds,
  } = useCandidateIds(electionId);
  const candidateIds = candidateIdsRaw as readonly bigint[] | undefined;

  // Prepare batch read for candidate details
  const candidateQueries = useMemo(() => {
    if (!candidateIds) return [];
    return candidateIds.map((cid) => ({
      address: contractAddress,
      abi: VOTING_PLATFORM_ABI as any,
      functionName: "getCandidate",
      args: [electionId, cid],
    }));
  }, [candidateIds, electionId, contractAddress]);

  const {
    data: candidatesData,
    isLoading: isCandidatesLoading,
    refetch: refetchCandidates,
  } = useReadContracts({
    contracts: candidateQueries as any,
    query: { enabled: candidateQueries.length > 0 },
  });

  // Local form states for direct candidate adding
  const [candName, setCandName] = useState("");
  const [candDesc, setCandDesc] = useState("");
  const [candImg, setCandImg] = useState("");
  const [candWallet, setCandWallet] = useState("");

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

  // Mutations
  const { writeContract: addCandidate, isPending: isAddPending } =
    useAddCandidate();
  const { writeContract: approveCandidate, isPending: isApprovePending } =
    useApproveCandidate();
  const { writeContract: rejectCandidate, isPending: isRejectPending } =
    useRejectCandidate();

  // Parse Candidates List
  const { pendingCandidates, approvedCandidates } = useMemo(() => {
    const pending: Candidate[] = [];
    const approved: Candidate[] = [];

    if (!candidatesData) return { pendingCandidates: pending, approvedCandidates: approved };

    candidatesData.forEach((res: any) => {
      const val = res.result || res;
      if (!val || !val.exists) return;

      const candidate: Candidate = {
        id: val.id,
        electionId: val.electionId,
        name: val.name,
        description: val.description,
        imageUrl: val.imageUrl,
        walletAddress: val.walletAddress,
        voteCount: val.voteCount,
        approved: val.approved,
        exists: val.exists,
      };

      if (candidate.approved) {
        approved.push(candidate);
      } else {
        pending.push(candidate);
      }
    });

    return { pendingCandidates: pending, approvedCandidates: approved };
  }, [candidatesData]);

  if (isElectionLoading || !electionRaw) {
    return (
      <div className={styles.loaderContainer}>
        <div className="spinner" />
      </div>
    );
  }

  const election = electionRaw as unknown as Election;
  const status = (statusRaw || "Ended") as string;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["Ended"];
  const isEnded = status === "Ended";

  // Action Handlers
  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName.trim() || !candWallet.trim()) {
      showToast("Name and Wallet Address are required", "error");
      return;
    }

    addCandidate(
      {
        address: contractAddress,
        abi: VOTING_PLATFORM_ABI,
        functionName: "addCandidate",
        args: [
          electionId,
          candName,
          candDesc,
          candImg,
          candWallet as `0x${string}`,
        ],
      },
      {
        onSuccess: () => {
          showToast("Approved candidate added successfully!", "success");
          setCandName("");
          setCandDesc("");
          setCandImg("");
          setCandWallet("");
          // Refetch state
          refetchIds();
          refetchCandidates();
          refetchElection();
        },
        onError: (err: any) => {
          console.error(err);
          const msg =
            err.shortMessage || err.message || "Failed to add candidate";
          showToast(msg, "error");
        },
      },
    );
  };

  const handleApprove = (candidateId: bigint) => {
    approveCandidate(
      {
        address: contractAddress,
        abi: VOTING_PLATFORM_ABI,
        functionName: "approveCandidate",
        args: [electionId, candidateId],
      },
      {
        onSuccess: () => {
          showToast("Candidate approved successfully!", "success");
          refetchCandidates();
        },
        onError: (err: any) => {
          console.error(err);
          const msg =
            err.shortMessage || err.message || "Failed to approve candidate";
          showToast(msg, "error");
        },
      },
    );
  };

  const handleReject = (candidateId: bigint) => {
    rejectCandidate(
      {
        address: contractAddress,
        abi: VOTING_PLATFORM_ABI,
        functionName: "rejectCandidate",
        args: [electionId, candidateId],
      },
      {
        onSuccess: () => {
          showToast("Candidate rejected/removed successfully!", "success");
          refetchIds();
          refetchCandidates();
        },
        onError: (err: any) => {
          console.error(err);
          const msg =
            err.shortMessage || err.message || "Failed to reject candidate";
          showToast(msg, "error");
        },
      },
    );
  };

  const isLoading = isRoleLoading || isIdsLoading || isCandidatesLoading;

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
          <Link href="/" className="btn btn-outline btn-sm">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <Link href="/admin" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to admin dashboard
      </Link>

      {/* Election Header Summary */}
      <div className={`card ${styles.headerCard}`}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{election.title}</h1>
          <p className={styles.desc}>{election.description}</p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
          <span className="badge badge-ended">
            {Number(election.totalVotes).toLocaleString()} votes cast
          </span>
        </div>
      </div>

      {/* Two-Column Grid */}
      <div className={styles.layout}>
        {/* Left Column: Candidate Management */}
        <div className={styles.leftCol}>
          {/* Pending Submissions */}
          <div>
            <h2 className={styles.sectionTitle}>
              <Clock size={18} />
              Pending Registrations ({pendingCandidates.length})
            </h2>

            {isLoading ? (
              <div className="spinner" />
            ) : pendingCandidates.length === 0 ? (
              <div className={`card ${styles.emptyState}`}>
                No self-registered candidates awaiting review.
              </div>
            ) : (
              <div className={styles.list}>
                {pendingCandidates.map((cand) => (
                  <div
                    key={cand.id.toString()}
                    className={`card ${styles.itemCard}`}
                  >
                    {cand.imageUrl ? (
                      <img
                        src={cand.imageUrl}
                        alt={cand.name}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>N/A</div>
                    )}
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemName}>{cand.name}</h4>
                      {cand.description && (
                        <p className={styles.itemDesc}>{cand.description}</p>
                      )}
                      <span className={styles.itemAddress}>
                        {cand.walletAddress}
                      </span>
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApprove(cand.id)}
                        disabled={isApprovePending || isEnded}
                        title={
                          isEnded ? "Election has ended" : "Approve Candidate"
                        }
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(cand.id)}
                        disabled={isRejectPending}
                        title="Reject Candidate"
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved Candidates */}
          <div>
            <h2 className={styles.sectionTitle}>
              <Users size={18} />
              Approved Candidates ({approvedCandidates.length})
            </h2>

            {isLoading ? (
              <div className="spinner" />
            ) : approvedCandidates.length === 0 ? (
              <div className={`card ${styles.emptyState}`}>
                No approved candidates in this election. Use the side panel to
                add one.
              </div>
            ) : (
              <div className={styles.list}>
                {approvedCandidates.map((cand) => (
                  <div
                    key={cand.id.toString()}
                    className={`card ${styles.itemCard}`}
                  >
                    {cand.imageUrl ? (
                      <img
                        src={cand.imageUrl}
                        alt={cand.name}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>N/A</div>
                    )}
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemName}>{cand.name}</h4>
                      {cand.description && (
                        <p className={styles.itemDesc}>{cand.description}</p>
                      )}
                      <span className={styles.itemAddress}>
                        {cand.walletAddress}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        marginLeft: "auto",
                      }}
                    >
                      <span className={styles.itemVotes}>
                        {Number(cand.voteCount).toLocaleString()} votes
                      </span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(cand.id)}
                        disabled={isRejectPending}
                        title="Remove Candidate"
                      >
                        <X size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Direct Add Candidate */}
        <div className={styles.rightCol}>
          {isEnded ? (
            <div
              className="card"
              style={{
                padding: "1.5rem",
                display: "flex",
                gap: "0.75rem",
                borderLeft: "4px solid var(--color-danger)",
              }}
            >
              <AlertTriangle
                size={20}
                style={{ color: "var(--color-danger)", flexShrink: 0 }}
              />
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                  Election Concluded
                </h4>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--color-text-2)",
                    marginTop: "0.15rem",
                  }}
                >
                  This election has ended. You can no longer add new candidates
                  or approve self-registered profiles.
                </p>
              </div>
            </div>
          ) : (
            <div className={`card ${styles.formCard}`}>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  marginBottom: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <UserPlus size={18} />
                Add Approved Candidate
              </h3>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--color-text-2)",
                  marginBottom: "1.25rem",
                }}
              >
                Directly register a candidate. This bypasses the approval
                pipeline, making them instantly eligible to receive votes once
                polls open.
              </p>

              <form onSubmit={handleAddCandidate} className={styles.form}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Candidate name"
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Wallet Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0x..."
                    value={candWallet}
                    onChange={(e) => setCandWallet(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    placeholder="Short bio or manifesto..."
                    value={candDesc}
                    onChange={(e) => setCandDesc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Avatar Image URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/photo.jpg"
                    value={candImg}
                    onChange={(e) => setCandImg(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isAddPending}
                  style={{ marginTop: "0.5rem" }}
                >
                  {isAddPending ? "Adding..." : "Add Candidate"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

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
