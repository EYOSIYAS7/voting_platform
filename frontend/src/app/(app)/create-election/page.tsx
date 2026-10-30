"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { organizationsApi } from "@/lib/api/organizations";
import { electionsApi } from "@/lib/api/elections";
import {
  SystemRole,
  ElectionType,
  OrganizationalUnit,
} from "@/lib/types/api";
import {
  EligibilityRuleBuilder,
  ConfiguredRule,
} from "@/components/EligibilityRuleBuilder";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import styles from "./create-election.module.css";

export default function CreateElectionPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, hasRole, employee } = useAuthStore();

  const canCreate =
    hasRole(SystemRole.ELECTION_ADMIN) || hasRole(SystemRole.SYSTEM_ADMIN);

  // Stepper state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Basics Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [electionType, setElectionType] = useState<ElectionType>(
    ElectionType.GENERAL,
  );
  const [unitScopeId, setUnitScopeId] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxCandidates, setMaxCandidates] = useState<string>('10');

  // Step 2: Rules State
  const [rules, setRules] = useState<ConfiguredRule[]>([]);

  // Metadata
  const [orgUnits, setOrgUnits] = useState<OrganizationalUnit[]>([]);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Access guard
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || !canCreate) {
        router.replace("/dashboard");
      }
    }
  }, [isInitialized, isAuthenticated, canCreate, router]);

  // Load organization and organizational units
  useEffect(() => {
    async function loadOrgData() {
      try {
        let orgId = employee?.organizationalUnit?.organizationId;
        if (!orgId) {
          const orgs = await organizationsApi.getOrganizations();
          if (orgs.length > 0) orgId = orgs[0].id;
        }
        if (orgId) {
          setOrganizationId(orgId);
          const units = await organizationsApi.getOrgUnits(orgId);
          setOrgUnits(units);
        }
      } catch (err) {
        console.error("Failed to load organization metadata:", err);
      }
    }

    if (isAuthenticated) {
      loadOrgData();
    }
  }, [isAuthenticated, employee]);

  // Step 1 validation
  const validateStep1 = () => {
    if (!title.trim()) {
      setErrorMessage("Please enter an election title.");
      return false;
    }
    if (electionType === ElectionType.UNIT_SCOPED && !unitScopeId) {
      setErrorMessage("Please choose a unit scope for unit-scoped elections.");
      return false;
    }
    if (!startDate) {
      setErrorMessage("Please select when voting opens.");
      return false;
    }
    if (!endDate) {
      setErrorMessage("Please select when voting closes.");
      return false;
    }

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (start >= end) {
      setErrorMessage(
        "Voting open date must be strictly before voting close date.",
      );
      return false;
    }

    if (registrationDeadline) {
      const reg = new Date(registrationDeadline).getTime();
      if (reg >= start) {
        setErrorMessage("Registration deadline must be before voting opens.");
        return false;
      }
    }

    setErrorMessage(null);
    return true;
  };

  const handleNextFromStep1 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  // Submit and create election with rules
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (!organizationId) {
        throw new Error(
          "No organizational identity found to associate with this election.",
        );
      }

      // 1. Create Election Record (DRAFT)
      const election = await electionsApi.createElection({
        title: title.trim(),
        description: description.trim() || undefined,
        electionType,
        organizationId,
        unitScopeId:
          electionType === ElectionType.UNIT_SCOPED ? unitScopeId : undefined,
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline).toISOString()
          : undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        maxCandidates: Math.max(0, parseInt(maxCandidates, 10) || 0),
      });

      // 2. Attach Configured Eligibility Rules
      for (const rule of rules) {
        if (rule.type === "scope") {
          await electionsApi.addEligibilityRule(election.id, {
            unitId: rule.unitId || undefined,
            includeDescendants: rule.includeDescendants,
            allowedPositionIds:
              rule.allowedPositionIds.length > 0
                ? rule.allowedPositionIds
                : undefined,
            minTenureMonths: rule.minTenureMonths,
            requiredStatus: rule.requiredStatus,
            description: rule.description,
          });
        } else {
          await electionsApi.addEligibilityRule(election.id, {
            employeeId: rule.employeeId,
            description: rule.description,
          });
        }
      }

      // 3. Compute eligible voters automatically based on newly attached rules
      await electionsApi.computeEligibleVoters(election.id).catch(() => {});

      // 4. Redirect to Management page
      router.push(`/my-elections/${election.id}`);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to create election. Please verify your inputs.",
      );
      setIsSubmitting(false);
    }
  };

  if (!isInitialized || !canCreate) {
    return (
      <div
        className="container"
        style={{ padding: "4rem 0", textAlign: "center" }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Create New Election</h1>
        <p className={styles.subtitle}>
          Set up institutional election parameters, candidate registration, and
          scoped eligibility rules.
        </p>
      </div>

      {/* ── Stepper Indicator ── */}
      <div className={styles.stepper} aria-label="Creation Steps">
        <div className={styles.stepItem}>
          <div
            className={`${styles.stepBubble} ${
              currentStep === 1
                ? styles.stepBubbleActive
                : currentStep > 1
                  ? styles.stepBubbleCompleted
                  : ""
            }`}
          >
            {currentStep > 1 ? <Check size={16} /> : "1"}
          </div>
          <span
            className={`${styles.stepLabel} ${
              currentStep === 1 ? styles.stepLabelActive : ""
            }`}
          >
            Basics & Schedule
          </span>
        </div>

        <div className={styles.stepItem}>
          <div
            className={`${styles.stepBubble} ${
              currentStep === 2
                ? styles.stepBubbleActive
                : currentStep > 2
                  ? styles.stepBubbleCompleted
                  : ""
            }`}
          >
            {currentStep > 2 ? <Check size={16} /> : "2"}
          </div>
          <span
            className={`${styles.stepLabel} ${
              currentStep === 2 ? styles.stepLabelActive : ""
            }`}
          >
            Voter Eligibility
          </span>
        </div>

        <div className={styles.stepItem}>
          <div
            className={`${styles.stepBubble} ${
              currentStep === 3 ? styles.stepBubbleActive : ""
            }`}
          >
            3
          </div>
          <span
            className={`${styles.stepLabel} ${
              currentStep === 3 ? styles.stepLabelActive : ""
            }`}
          >
            Review & Create
          </span>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMessage && (
        <div className={styles.errorBanner}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Step 1: Basics & Schedule ── */}
      {currentStep === 1 && (
        <div className={styles.card}>
          <h2 className={styles.stepTitle}>1. Election Basics & Timeline</h2>

          <div className={styles.formGrid}>
            <div className={`form-group ${styles.fullCol}`}>
              <label className="form-label" htmlFor="election-title">
                Election Title *
              </label>
              <input
                id="election-title"
                type="text"
                className="form-input"
                placeholder="e.g. 2026 Directorate Representative Election"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className={`form-group ${styles.fullCol}`}>
              <label className="form-label" htmlFor="election-desc">
                Description / Purpose
              </label>
              <textarea
                id="election-desc"
                className="form-input"
                rows={3}
                placeholder="Brief summary of the election objectives, responsibilities, and key instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className={`form-group ${styles.fullCol}`}>
              <label className="form-label">Election Type</label>
              <div className={styles.radioGroup}>
                <div
                  className={`${styles.radioCard} ${
                    electionType === ElectionType.GENERAL
                      ? styles.radioCardSelected
                      : ""
                  }`}
                  onClick={() => setElectionType(ElectionType.GENERAL)}
                >
                  <span className={styles.radioCardTitle}>
                    General Election
                  </span>
                  <span className={styles.radioCardDesc}>
                    Open organization-wide or filtered by rules across all
                    units.
                  </span>
                </div>

                <div
                  className={`${styles.radioCard} ${
                    electionType === ElectionType.UNIT_SCOPED
                      ? styles.radioCardSelected
                      : ""
                  }`}
                  onClick={() => setElectionType(ElectionType.UNIT_SCOPED)}
                >
                  <span className={styles.radioCardTitle}>Unit-Scoped</span>
                  <span className={styles.radioCardDesc}>
                    Restricted to a specific department, division, or team
                    branch.
                  </span>
                </div>

                <div
                  className={`${styles.radioCard} ${
                    electionType === ElectionType.POSITION_SCOPED
                      ? styles.radioCardSelected
                      : ""
                  }`}
                  onClick={() => setElectionType(ElectionType.POSITION_SCOPED)}
                >
                  <span className={styles.radioCardTitle}>Position-Scoped</span>
                  <span className={styles.radioCardDesc}>
                    Dedicated to specific positions across the organization (defined in Step 2).
                  </span>
                </div>
              </div>
            </div>

            {electionType === ElectionType.UNIT_SCOPED && (
              <div className={`form-group ${styles.fullCol}`}>
                <label className="form-label" htmlFor="unit-scope">
                  Target Organizational Unit Scope *
                </label>
                <select
                  id="unit-scope"
                  className="form-input"
                  value={unitScopeId}
                  onChange={(e) => setUnitScopeId(e.target.value)}
                >
                  <option value="">Select Organizational Unit...</option>
                  {orgUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.unitType})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="reg-deadline">
                Registration Deadline (Optional)
              </label>
              <input
                id="reg-deadline"
                type="datetime-local"
                className="form-input"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
              />
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-3)",
                  marginTop: "0.2rem",
                }}
              >
                Leave empty if candidate registration happens in advance.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="max-cand">
                Max Allowed Candidates
              </label>
              <input
                id="max-cand"
                type="number"
                min="0"
                className="form-input"
                value={maxCandidates}
                onChange={(e) => setMaxCandidates(e.target.value)}
              />
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-3)",
                  marginTop: "0.2rem",
                }}
              >
                0 = Unlimited candidates.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="start-date">
                Voting Opens *
              </label>
              <input
                id="start-date"
                type="datetime-local"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="end-date">
                Voting Closes *
              </label>
              <input
                id="end-date"
                type="datetime-local"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.navRow}>
            <Link href="/dashboard" className="btn btn-outline">
              Cancel
            </Link>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextFromStep1}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>Next: Eligibility Rules</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Eligibility Rules ── */}
      {currentStep === 2 && (
        <div className={styles.card}>
          <h2 className={styles.stepTitle}>
            2. Define Voter Eligibility Rules
          </h2>

          <EligibilityRuleBuilder
            organizationId={organizationId}
            rules={rules}
            onChange={setRules}
          />

          <div className={styles.navRow}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setCurrentStep(1)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Basics</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setErrorMessage(null);
                setCurrentStep(3);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span>Next: Review & Submit</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Submit ── */}
      {currentStep === 3 && (
        <div className={styles.card}>
          <h2 className={styles.stepTitle}>3. Review Election & Confirm</h2>

          <div className={styles.summaryGrid}>
            <div className={styles.summarySection}>
              <h3 className={styles.summarySectionTitle}>Election Details</h3>
              <dl className={styles.summaryList}>
                <dt>Title</dt>
                <dd style={{ fontWeight: 600 }}>{title}</dd>
                {description && (
                  <>
                    <dt>Description</dt>
                    <dd>{description}</dd>
                  </>
                )}
                <dt>Election Type</dt>
                <dd>{electionType.replace(/_/g, ' ')}</dd>
                {electionType === ElectionType.UNIT_SCOPED && (
                  <>
                    <dt>Unit Scope</dt>
                    <dd>
                      {orgUnits.find((u) => u.id === unitScopeId)?.name ||
                        unitScopeId}
                    </dd>
                  </>
                )}
                <dt>Max Candidates</dt>
                <dd>
                  {(parseInt(maxCandidates, 10) || 0) === 0
                    ? 'Unlimited'
                    : parseInt(maxCandidates, 10)}
                </dd>
              </dl>
            </div>

            <div className={styles.summarySection}>
              <h3 className={styles.summarySectionTitle}>Schedule</h3>
              <dl className={styles.summaryList}>
                {registrationDeadline && (
                  <>
                    <dt>Registration Deadline</dt>
                    <dd>{new Date(registrationDeadline).toLocaleString()}</dd>
                  </>
                )}
                <dt>Voting Opens</dt>
                <dd>{new Date(startDate).toLocaleString()}</dd>
                <dt>Voting Closes</dt>
                <dd>{new Date(endDate).toLocaleString()}</dd>
              </dl>
            </div>

            <div className={`${styles.summarySection} ${styles.fullCol}`}>
              <h3 className={styles.summarySectionTitle}>
                Eligibility Rules ({rules.length})
              </h3>
              {rules.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.75rem',
                    background: 'rgba(59, 100, 175, 0.08)',
                    border: '1px solid rgba(59, 100, 175, 0.25)',
                    borderRadius: 'var(--r-md)',
                    color: 'var(--color-text)',
                    fontSize: '0.85rem',
                  }}
                >
                  <Info size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <span>
                    <strong>Open Ballot:</strong> No specific restrictions configured. All active
                    employees across the entire organization will be eligible to participate.
                  </span>
                </div>
              ) : (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.25rem",
                    fontSize: "0.85rem",
                    color: "var(--color-text)",
                    lineHeight: 1.6,
                  }}
                >
                  {rules.map((rule) => (
                    <li key={rule.id}>
                      <strong>
                        {rule.type === "scope" ? "Scope:" : "Individual:"}
                      </strong>{" "}
                      {rule.type === "scope" ? (
                        <>
                          {rule.unitName}
                          {rule.unitId &&
                            rule.includeDescendants &&
                            " (+ sub-units)"}
                          {" — "}
                          {rule.positionNames && rule.positionNames.length > 0
                            ? `Positions: ${rule.positionNames.join(", ")}`
                            : "All positions"}
                          {rule.minTenureMonths > 0 &&
                            ` (Min tenure: ${rule.minTenureMonths} mo)`}
                        </>
                      ) : (
                        <>
                          {rule.employeeName} ({rule.employeeCode})
                          {rule.positionName ? ` — ${rule.positionName}` : ""}
                        </>
                      )}
                      {rule.description ? ` [${rule.description}]` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={styles.navRow}>
            <button
              type="button"
              className="btn btn-outline"
              disabled={isSubmitting}
              onClick={() => {
                setErrorMessage(null);
                setCurrentStep(2);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Rules</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Creating Election...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Create Election</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
