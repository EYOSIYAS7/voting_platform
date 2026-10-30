'use client';

import { useState, useEffect, useRef } from 'react';
import { organizationsApi } from '@/lib/api/organizations';
import { employeesApi } from '@/lib/api/employees';
import {
  OrganizationalUnit,
  Position,
  EmployeeWithDetails,
} from '@/lib/types/api';
import {
  Users,
  Building2,
  UserCheck,
  Plus,
  Trash2,
  Info,
  Check,
  Search,
  X,
  Layers,
} from 'lucide-react';
import styles from './EligibilityRuleBuilder.module.css';

export interface ConfiguredRule {
  id: string;
  type: 'scope' | 'employee';
  // Scope rule fields
  unitId?: string;
  unitName?: string;
  includeDescendants: boolean;
  allowedPositionIds: string[];
  positionNames?: string[];
  minTenureMonths: number;
  requiredStatus: string;
  // Specific employee fields
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  positionName?: string;
  // Common
  description?: string;
}

interface Props {
  organizationId: string;
  rules: ConfiguredRule[];
  onChange: (rules: ConfiguredRule[]) => void;
}

export function EligibilityRuleBuilder({ organizationId, rules, onChange }: Props) {
  const [orgUnits, setOrgUnits] = useState<OrganizationalUnit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  // Form builder state
  const [ruleType, setRuleType] = useState<'scope' | 'employee'>('scope');

  // Scope form fields
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [includeDescendants, setIncludeDescendants] = useState<boolean>(true);
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([]);
  const [minTenureMonths, setMinTenureMonths] = useState<number>(0);
  const [requiredStatus, setRequiredStatus] = useState<string>('ACTIVE');
  const [scopeDescription, setScopeDescription] = useState<string>('');

  // Employee search form fields
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EmployeeWithDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithDetails | null>(null);
  const [employeeDescription, setEmployeeDescription] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load organizational units & positions for metadata lookup
  useEffect(() => {
    if (!organizationId) return;
    setIsLoadingMeta(true);
    Promise.all([
      organizationsApi.getOrgUnits(organizationId).catch(() => []),
      organizationsApi.getPositions().catch(() => []),
    ])
      .then(([units, posList]) => {
        setOrgUnits(units);
        setPositions(posList);
      })
      .finally(() => setIsLoadingMeta(false));
  }, [organizationId]);

  // Handle employee search debounce
  useEffect(() => {
    if (!searchQuery.trim() || selectedEmployee) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(true);
      employeesApi
        .getEmployees({ search: searchQuery.trim() })
        .then((emps) => setSearchResults(emps.slice(0, 8)))
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, selectedEmployee]);

  // Position selection toggle
  const togglePosition = (posId: string) => {
    setSelectedPositionIds((prev) =>
      prev.includes(posId) ? prev.filter((id) => id !== posId) : [...prev, posId]
    );
  };

  // Select all / clear positions
  const handleSelectAllPositions = () => {
    if (selectedPositionIds.length === positions.length) {
      setSelectedPositionIds([]);
    } else {
      setSelectedPositionIds(positions.map((p) => p.id));
    }
  };

  // Add scope rule
  const handleAddScopeRule = () => {
    const unit = orgUnits.find((u) => u.id === selectedUnitId);
    const posNames = selectedPositionIds
      .map((id) => positions.find((p) => p.id === id)?.name)
      .filter(Boolean) as string[];

    const newRule: ConfiguredRule = {
      id: crypto.randomUUID(),
      type: 'scope',
      unitId: selectedUnitId || undefined,
      unitName: unit ? unit.name : 'All Units (Organization-wide)',
      includeDescendants,
      allowedPositionIds: selectedPositionIds,
      positionNames: posNames,
      minTenureMonths: Number(minTenureMonths) || 0,
      requiredStatus,
      description: scopeDescription.trim() || undefined,
    };

    onChange([...rules, newRule]);

    // Reset scope inputs
    setSelectedUnitId('');
    setSelectedPositionIds([]);
    setMinTenureMonths(0);
    setRequiredStatus('ACTIVE');
    setScopeDescription('');
  };

  // Add specific employee rule
  const handleAddEmployeeRule = () => {
    if (!selectedEmployee) return;

    const empName = `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim();
    const newRule: ConfiguredRule = {
      id: crypto.randomUUID(),
      type: 'employee',
      employeeId: selectedEmployee.id,
      employeeName: empName,
      employeeCode: selectedEmployee.employeeId,
      positionName: selectedEmployee.position?.name,
      unitName: selectedEmployee.organizationalUnit?.name,
      includeDescendants: false,
      allowedPositionIds: [],
      minTenureMonths: 0,
      requiredStatus: selectedEmployee.status || 'ACTIVE',
      description:
        employeeDescription.trim() || `Specific Employee: ${empName} (${selectedEmployee.employeeId})`,
    };

    onChange([...rules, newRule]);

    // Reset employee inputs
    setSelectedEmployee(null);
    setSearchQuery('');
    setEmployeeDescription('');
  };

  const handleRemoveRule = (ruleId: string) => {
    onChange(rules.filter((r) => r.id !== ruleId));
  };

  return (
    <div className={styles.container}>
      <div className={styles.notice}>
        <Info size={18} className={styles.noticeIcon} />
        <div>
          <strong>How eligibility rules work:</strong> Rules are evaluated with <em>OR logic</em>. An
          employee is eligible to vote if they match <strong>any</strong> configured rule. If no rules
          are specified, all active employees in the organization are eligible.
        </div>
      </div>

      {/* ── Active Rules Summary List ── */}
      <div className={styles.rulesList}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
            Configured Eligibility Rules ({rules.length})
          </h4>
        </div>

        {rules.length === 0 ? (
          <div className={styles.emptyRules}>
            <Layers size={28} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p style={{ margin: 0 }}>No specific rules defined yet.</p>
            <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>
              Default behavior: All active organization employees can vote.
            </span>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className={styles.ruleCard}>
              <div className={styles.ruleCardContent}>
                <div className={styles.ruleHeader}>
                  <span
                    className={`${styles.ruleTypeBadge} ${
                      rule.type === 'scope' ? styles.ruleTypeScope : styles.ruleTypeEmployee
                    }`}
                  >
                    {rule.type === 'scope' ? 'Scope Rule' : 'Specific Employee'}
                  </span>
                  <h5 className={styles.ruleTitle}>
                    {rule.type === 'scope'
                      ? rule.unitName || 'Organization-wide'
                      : rule.employeeName}
                  </h5>
                </div>

                <div className={styles.ruleDetails}>
                  {rule.type === 'scope' ? (
                    <>
                      <span className={styles.rulePill}>
                        <Building2 size={12} />
                        {rule.unitName}
                        {rule.unitId && rule.includeDescendants && ' (+ sub-units)'}
                      </span>
                      <span className={styles.rulePill}>
                        <Users size={12} />
                        {rule.positionNames && rule.positionNames.length > 0
                          ? `Positions: ${rule.positionNames.join(', ')}`
                          : 'All Positions'}
                      </span>
                      {rule.minTenureMonths > 0 && (
                        <span className={styles.rulePill}>
                          Min Tenure: {rule.minTenureMonths} mo
                        </span>
                      )}
                      <span className={styles.rulePill}>Status: {rule.requiredStatus}</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.rulePill}>
                        <UserCheck size={12} /> ID: {rule.employeeCode}
                      </span>
                      {rule.unitName && (
                        <span className={styles.rulePill}>
                          <Building2 size={12} /> {rule.unitName}
                        </span>
                      )}
                      {rule.positionName && (
                        <span className={styles.rulePill}>
                          <Users size={12} /> {rule.positionName}
                        </span>
                      )}
                    </>
                  )}
                  {rule.description && (
                    <span style={{ fontStyle: 'italic', opacity: 0.85 }}>
                      "{rule.description}"
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveRule(rule.id)}
                className={styles.removeBtn}
                title="Remove this rule"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Add Rule Form Box ── */}
      <div className={styles.builderBox}>
        <div className={styles.builderHeader}>
          <h4 className={styles.builderTitle}>Add Eligibility Rule</h4>
          <div className={styles.typeToggleGroup} role="tablist">
            <button
              type="button"
              className={`${styles.typeToggleBtn} ${
                ruleType === 'scope' ? styles.typeToggleBtnActive : ''
              }`}
              onClick={() => setRuleType('scope')}
            >
              By Scope (Unit & Positions)
            </button>
            <button
              type="button"
              className={`${styles.typeToggleBtn} ${
                ruleType === 'employee' ? styles.typeToggleBtnActive : ''
              }`}
              onClick={() => setRuleType('employee')}
            >
              By Specific Employee
            </button>
          </div>
        </div>

        {ruleType === 'scope' ? (
          /* ── Scope Form ── */
          <div className={styles.formGrid}>
            <div className="form-group">
              <label className="form-label" htmlFor="rule-unit">
                Organizational Unit Scope
              </label>
              <select
                id="rule-unit"
                className="form-input"
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                disabled={isLoadingMeta}
              >
                <option value="">All Units (Entire Organization)</option>
                {orgUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.unitType})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ justifyContent: 'center' }}>
              <label className="form-label">Hierarchy Scope</label>
              {selectedUnitId ? (
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    marginTop: '0.35rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeDescendants}
                    onChange={(e) => setIncludeDescendants(e.target.checked)}
                  />
                  Include all descendant sub-units recursively
                </label>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', marginTop: '0.35rem' }}>
                  Applies organization-wide across all organizational units.
                </span>
              )}
            </div>

            <div className={`form-group ${styles.fullCol}`}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.35rem',
                }}
              >
                <label className="form-label" style={{ margin: 0 }}>
                  Allowed Positions ({selectedPositionIds.length === 0 ? 'All' : selectedPositionIds.length}{' '}
                  selected)
                </label>
                {positions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllPositions}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {selectedPositionIds.length === positions.length ? 'Clear all' : 'Select all'}
                  </button>
                )}
              </div>
              <div className={styles.positionGrid}>
                {positions.map((pos) => {
                  const isSelected = selectedPositionIds.includes(pos.id);
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => togglePosition(pos.id)}
                      className={`${styles.posPill} ${isSelected ? styles.posPillSelected : ''}`}
                    >
                      {isSelected && <Check size={12} />}
                      <span>{pos.name}</span>
                      <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>Lvl {pos.level}</span>
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-3)', marginTop: '0.25rem' }}>
                Leave empty to allow all positions within this unit scope.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="rule-tenure">
                Min. Tenure (Months)
              </label>
              <input
                id="rule-tenure"
                type="number"
                min="0"
                className="form-input"
                placeholder="0 = No tenure requirement"
                value={minTenureMonths}
                onChange={(e) => setMinTenureMonths(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="rule-status">
                Required Employee Status
              </label>
              <select
                id="rule-status"
                className="form-input"
                value={requiredStatus}
                onChange={(e) => setRequiredStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE only</option>
                <option value="ANY">ANY (Active, Pending, etc.)</option>
              </select>
            </div>

            <div className={`form-group ${styles.fullCol}`}>
              <label className="form-label" htmlFor="scope-desc">
                Rule Label / Description (Optional)
              </label>
              <input
                id="scope-desc"
                type="text"
                className="form-input"
                placeholder="e.g. Software Directorate Senior Engineers"
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
              />
            </div>

            <div className={`${styles.actionRow} ${styles.fullCol}`}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddScopeRule}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={15} /> Add Scope Rule
              </button>
            </div>
          </div>
        ) : (
          /* ── By Specific Employee Form ── */
          <div className={styles.formGrid}>
            <div className={`form-group ${styles.fullCol}`}>
              <label className="form-label">Search & Select Employee</label>
              {!selectedEmployee ? (
                <div className={styles.searchWrapper}>
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={15}
                      style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-text-3)',
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '2.25rem' }}
                      placeholder="Type employee name, code, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {searchResults.length > 0 && (
                    <ul className={styles.searchResults}>
                      {searchResults.map((emp) => (
                        <li
                          key={emp.id}
                          className={styles.searchItem}
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                        >
                          <span className={styles.searchItemName}>
                            {emp.firstName} {emp.lastName} ({emp.employeeId})
                          </span>
                          <span className={styles.searchItemMeta}>
                            {emp.position?.name || 'No position'} •{' '}
                            {emp.organizationalUnit?.name || 'No unit'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {isSearching && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', marginTop: '0.25rem' }}>
                      Searching employees...
                    </span>
                  )}
                </div>
              ) : (
                <div className={styles.selectedEmpCard}>
                  <div className={styles.selectedEmpInfo}>
                    <span className={styles.selectedEmpName}>
                      {selectedEmployee.firstName} {selectedEmployee.lastName} (
                      {selectedEmployee.employeeId})
                    </span>
                    <span className={styles.selectedEmpMeta}>
                      {selectedEmployee.position?.name || 'No position'} •{' '}
                      {selectedEmployee.organizationalUnit?.name || 'No unit'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEmployee(null)}
                    className={styles.removeBtn}
                    title="Change selected employee"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className={`form-group ${styles.fullCol}`}>
              <label className="form-label" htmlFor="emp-desc">
                Reason / Note (Optional)
              </label>
              <input
                id="emp-desc"
                type="text"
                className="form-input"
                placeholder="e.g. Directorate supervisor specific addition"
                value={employeeDescription}
                onChange={(e) => setEmployeeDescription(e.target.value)}
              />
            </div>

            <div className={`${styles.actionRow} ${styles.fullCol}`}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddEmployeeRule}
                disabled={!selectedEmployee}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={15} /> Add Individual Employee
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
