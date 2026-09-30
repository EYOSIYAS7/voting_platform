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
  X,
  Check,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import styles from "./admin-election.module.css";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  Active: { label: "Open", cls: "status-active" },
  Upcoming: { label: "Voting soon", cls: "status-upcoming" },
  Registration: { label: "Registration", cls: "status-registration" },
  Pending: { label: "Not yet open", cls: "status-pending" },
  Ended: { label: "Closed", cls: "status-ended" },
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
        <div className={styles.denied}>
          <h1>Admin access required</h1>
          <p>
            {!isConnected
              ? "Connect a wallet in the header to check whether you can administer elections."
              : "This wallet is not an administrator."}
          </p>
          <Link href="/" className="btn btn-outline btn-sm">
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <Link href="/admin" className={styles.backLink}>
        Admin
      </Link>

      <header className={`panel panel-pad ${styles.header}`}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{election.title}</h1>
          {election.description && <p className={styles.desc}>{election.description}</p>}
        </div>
        <p className={styles.metaLine}>
          <span className={cfg.cls}>{cfg.label}</span>
          <span>
            {Number(election.totalVotes).toLocaleString()}{" "}
            {Number(election.totalVotes) === 1 ? "vote" : "votes"}
          </span>
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className="panel panel-pad">
            <h2 className={styles.sectionTitle}>
              Pending ({pendingCandidates.length})
            </h2>

            {isLoading ? (
              <div className="spinner" />
            ) : pendingCandidates.length === 0 ? (
              <p className={styles.emptyState}>No registrations waiting for review.</p>
            ) : (
              <div className={styles.list}>
                {pendingCandidates.map((cand) => (
                  <div key={cand.id.toString()} className={styles.item}>
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
                          isEnded ? "Election has ended" : "Approve candidate"
                        }
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(cand.id)}
                        disabled={isRejectPending}
                        title="Reject candidate"
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

          <div className="panel panel-pad">
            <h2 className={styles.sectionTitle}>
              On the ballot ({approvedCandidates.length})
            </h2>

            {isLoading ? (
              <div className="spinner" />
            ) : approvedCandidates.length === 0 ? (
              <p className={styles.emptyState}>
                No approved candidates. Add one on the right, or approve a pending registration.
              </p>
            ) : (
              <div className={styles.list}>
                {approvedCandidates.map((cand) => (
                  <div key={cand.id.toString()} className={styles.item}>
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
                      <span className={styles.itemVotes}>
                        {Number(cand.voteCount).toLocaleString()} votes
                      </span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(cand.id)}
                        disabled={isRejectPending}
                        title="Remove candidate"
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

        <div className={styles.rightCol}>
          {isEnded ? (
            <p className={styles.endedNote}>
              This election is closed. Candidates can no longer be added or approved.
            </p>
          ) : (
            <div className={`panel panel-pad ${styles.formBlock}`}>
              <h3 className={styles.formTitle}>Add a candidate</h3>
              <p className={styles.formLead}>
                Adds them to the ballot immediately, without a pending review.
              </p>

              <form onSubmit={handleAddCandidate} className={styles.form}>
                <div className="form-group">
                  <label className="form-label" htmlFor="add-name">Full name</label>
                  <input
                    id="add-name"
                    type="text"
                    className="form-input"
                    placeholder="Name"
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="add-wallet">Wallet address</label>
                  <input
                    id="add-wallet"
                    type="text"
                    className="form-input"
                    placeholder="0x…"
                    value={candWallet}
                    onChange={(e) => setCandWallet(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="add-desc">Description</label>
                  <textarea
                    id="add-desc"
                    className="form-input"
                    placeholder="Short bio"
                    value={candDesc}
                    onChange={(e) => setCandDesc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="add-img">Photo URL (optional)</label>
                  <input
                    id="add-img"
                    type="url"
                    className="form-input"
                    placeholder="https://"
                    value={candImg}
                    onChange={(e) => setCandImg(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isAddPending}
                >
                  {isAddPending ? "Adding…" : "Add candidate"}
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
              <Info size={18} style={{ color: "var(--color-accent)" }} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
