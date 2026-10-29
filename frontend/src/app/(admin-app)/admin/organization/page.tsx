'use client';

import { useState, useEffect, useCallback } from 'react';
import { organizationsApi } from '@/lib/api/organizations';
import {
  Organization,
  CreateOrganizationDto,
  OrganizationalUnit,
  CreateOrganizationalUnitDto,
  UnitType,
  Position,
  CreatePositionDto,
} from '@/lib/types/api';
import { OrgUnitTree } from '@/components/OrgUnitTree';
import {
  Building2,
  FolderTree,
  Award,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import styles from './organization.module.css';

type ActiveTab = 'units' | 'organizations' | 'positions';

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('units');

  // ── Data State ─────────────────────────────────────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [unitTree, setUnitTree] = useState<OrganizationalUnit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Toast Notifications ───────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  // ── Modals State ──────────────────────────────────────────────────────────
  // Org Modal
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgLogo, setOrgLogo] = useState('');

  // Unit Modal
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<OrganizationalUnit | null>(null);
  const [parentUnitForNew, setParentUnitForNew] = useState<OrganizationalUnit | null>(null);
  const [unitName, setUnitName] = useState('');
  const [unitType, setUnitType] = useState<UnitType>(UnitType.DIRECTORATE);
  const [unitDesc, setUnitDesc] = useState('');

  // Position Modal
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [posName, setPosName] = useState('');
  const [posLevel, setPosLevel] = useState<number>(10);
  const [posDesc, setPosDesc] = useState('');

  // ── Data Fetching ─────────────────────────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [orgs, posList] = await Promise.all([
        organizationsApi.getOrganizations(),
        organizationsApi.getPositions(),
      ]);
      setOrganizations(orgs);
      setPositions(posList);

      if (orgs.length > 0) {
        const defaultOrg = orgs[0].id;
        setSelectedOrgId(defaultOrg);
        const tree = await organizationsApi.getOrgUnitsTree(defaultOrg);
        setUnitTree(tree);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load organizational data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const loadTreeForOrg = async (orgId: string) => {
    try {
      const tree = await organizationsApi.getOrgUnitsTree(orgId);
      setUnitTree(tree);
    } catch (err: any) {
      showToast(err.message || 'Failed to load organizational units', 'error');
    }
  };

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    loadTreeForOrg(orgId);
  };

  // ── Organization Handlers ─────────────────────────────────────────────────
  const handleOpenOrgModal = (org?: Organization) => {
    if (org) {
      setEditingOrg(org);
      setOrgName(org.name);
      setOrgDesc(org.description || '');
      setOrgLogo(org.logoUrl || '');
    } else {
      setEditingOrg(null);
      setOrgName('');
      setOrgDesc('');
      setOrgLogo('');
    }
    setIsOrgModalOpen(true);
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    try {
      if (editingOrg) {
        await organizationsApi.updateOrganization(editingOrg.id, {
          name: orgName.trim(),
          description: orgDesc.trim() || undefined,
          logoUrl: orgLogo.trim() || undefined,
        });
        showToast('Organization updated successfully', 'success');
      } else {
        const newOrg = await organizationsApi.createOrganization({
          name: orgName.trim(),
          description: orgDesc.trim() || undefined,
          logoUrl: orgLogo.trim() || undefined,
        });
        showToast('Organization created successfully', 'success');
        if (!selectedOrgId) setSelectedOrgId(newOrg.id);
      }
      setIsOrgModalOpen(false);
      const orgs = await organizationsApi.getOrganizations();
      setOrganizations(orgs);
    } catch (err: any) {
      showToast(err.message || 'Failed to save organization', 'error');
    }
  };

  const handleDeleteOrg = async (org: Organization) => {
    if (!confirm(`Are you sure you want to delete "${org.name}"? This cannot be undone.`)) return;

    try {
      await organizationsApi.deleteOrganization(org.id);
      showToast('Organization deleted', 'success');
      const orgs = await organizationsApi.getOrganizations();
      setOrganizations(orgs);
      if (selectedOrgId === org.id && orgs.length > 0) {
        setSelectedOrgId(orgs[0].id);
        loadTreeForOrg(orgs[0].id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete organization', 'error');
    }
  };

  // ── Unit Handlers ─────────────────────────────────────────────────────────
  const handleOpenUnitModal = (parent?: OrganizationalUnit, unitToEdit?: OrganizationalUnit) => {
    if (unitToEdit) {
      setEditingUnit(unitToEdit);
      setParentUnitForNew(null);
      setUnitName(unitToEdit.name);
      setUnitType(unitToEdit.unitType);
      setUnitDesc(unitToEdit.description || '');
    } else {
      setEditingUnit(null);
      setParentUnitForNew(parent || null);
      setUnitName('');
      setUnitType(parent ? UnitType.DIVISION : UnitType.DIRECTORATE);
      setUnitDesc('');
    }
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim() || !selectedOrgId) return;

    try {
      if (editingUnit) {
        await organizationsApi.updateOrgUnit(editingUnit.id, {
          name: unitName.trim(),
          unitType,
          description: unitDesc.trim() || undefined,
        });
        showToast('Unit updated', 'success');
      } else {
        const dto: CreateOrganizationalUnitDto = {
          organizationId: selectedOrgId,
          name: unitName.trim(),
          unitType,
          description: unitDesc.trim() || undefined,
          parentId: parentUnitForNew ? parentUnitForNew.id : undefined,
        };
        await organizationsApi.createOrgUnit(dto);
        showToast('Unit created', 'success');
      }
      setIsUnitModalOpen(false);
      loadTreeForOrg(selectedOrgId);
    } catch (err: any) {
      showToast(err.message || 'Failed to save unit', 'error');
    }
  };

  const handleDeleteUnit = async (unit: OrganizationalUnit) => {
    if (!confirm(`Are you sure you want to delete unit "${unit.name}"?`)) return;

    try {
      await organizationsApi.deleteOrgUnit(unit.id);
      showToast('Unit removed', 'success');
      loadTreeForOrg(selectedOrgId);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete unit (ensure it has no child units)', 'error');
    }
  };

  // ── Position Handlers ─────────────────────────────────────────────────────
  const handleOpenPosModal = (pos?: Position) => {
    if (pos) {
      setEditingPos(pos);
      setPosName(pos.name);
      setPosLevel(pos.level);
      setPosDesc(pos.description || '');
    } else {
      setEditingPos(null);
      setPosName('');
      setPosLevel(10);
      setPosDesc('');
    }
    setIsPosModalOpen(true);
  };

  const handleSavePos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posName.trim()) return;

    try {
      if (editingPos) {
        await organizationsApi.updatePosition(editingPos.id, {
          name: posName.trim(),
          level: Number(posLevel),
          description: posDesc.trim() || undefined,
        });
        showToast('Position updated', 'success');
      } else {
        const dto: CreatePositionDto = {
          name: posName.trim(),
          level: Number(posLevel),
          description: posDesc.trim() || undefined,
        };
        await organizationsApi.createPosition(dto);
        showToast('Position created', 'success');
      }
      setIsPosModalOpen(false);
      const posList = await organizationsApi.getPositions();
      setPositions(posList);
    } catch (err: any) {
      showToast(err.message || 'Failed to save position', 'error');
    }
  };

  const handleDeletePos = async (pos: Position) => {
    if (!confirm(`Are you sure you want to delete position "${pos.name}"?`)) return;

    try {
      await organizationsApi.deletePosition(pos.id);
      showToast('Position removed', 'success');
      const posList = await organizationsApi.getPositions();
      setPositions(posList);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete position', 'error');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Organization & Structure</h1>
          <p className={styles.subtitle}>
            Establish directorate trees, divisions, and hierarchical levels for scoping elections.
          </p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className={styles.tabs} aria-label="Organization views">
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'units' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('units')}
        >
          <FolderTree size={16} />
          <span>Unit Hierarchy</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'organizations' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('organizations')}
        >
          <Building2 size={16} />
          <span>Organizations ({organizations.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'positions' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('positions')}
        >
          <Award size={16} />
          <span>Positions & Levels ({positions.length})</span>
        </button>
      </nav>

      {/* ─── TAB 1: UNIT HIERARCHY TREE ──────────────────────────────────── */}
      {activeTab === 'units' && (
        <section className={styles.sectionCard}>
          <div className={styles.cardHead}>
            <div>
              <h2 className={styles.cardTitle}>Organizational Unit Tree</h2>
              <p className={styles.cardDesc}>
                Directorates, divisions, departments, and teams governing candidate and voter eligibility.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleOpenUnitModal(undefined)}
              disabled={!selectedOrgId}
            >
              <Plus size={15} />
              <span>Add Top-Level Directorate</span>
            </button>
          </div>

          {/* Org Selector */}
          {organizations.length > 0 ? (
            <div className={styles.orgSelectBar}>
              <span className={styles.selectLabel}>Active Organization:</span>
              <select
                className={`form-input ${styles.orgSelect}`}
                value={selectedOrgId}
                onChange={(e) => handleOrgChange(e.target.value)}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No organizations found. Please create an organization first.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setActiveTab('organizations');
                  handleOpenOrgModal();
                }}
              >
                Create Organization
              </button>
            </div>
          )}

          {selectedOrgId && (
            <OrgUnitTree
              units={unitTree}
              onAddChild={(parent) => handleOpenUnitModal(parent)}
              onEdit={(unit) => handleOpenUnitModal(undefined, unit)}
              onDelete={handleDeleteUnit}
            />
          )}
        </section>
      )}

      {/* ─── TAB 2: ORGANIZATIONS LIST ───────────────────────────────────── */}
      {activeTab === 'organizations' && (
        <section className={styles.sectionCard}>
          <div className={styles.cardHead}>
            <div>
              <h2 className={styles.cardTitle}>Organizations</h2>
              <p className={styles.cardDesc}>
                Top-level governing bodies registered in the platform.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleOpenOrgModal()}
            >
              <Plus size={15} />
              <span>New Organization</span>
            </button>
          </div>

          {organizations.length === 0 ? (
            <div className={styles.emptyState}>No organizations registered yet.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Organization Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id}>
                      <td>
                        <span className={styles.rowTitle}>{org.name}</span>
                      </td>
                      <td>{org.description || '—'}</td>
                      <td>
                        <span className="status status-active">{org.status || 'ACTIVE'}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenOrgModal(org)}
                            title="Edit organization"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleDeleteOrg(org)}
                            title="Delete organization"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ─── TAB 3: POSITIONS & LEVELS ───────────────────────────────────── */}
      {activeTab === 'positions' && (
        <section className={styles.sectionCard}>
          <div className={styles.cardHead}>
            <div>
              <h2 className={styles.cardTitle}>Positions & Hierarchy Levels</h2>
              <p className={styles.cardDesc}>
                Hierarchical rank governs candidate nomination limits (lower level number = higher rank).
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleOpenPosModal()}
            >
              <Plus size={15} />
              <span>New Position</span>
            </button>
          </div>

          {positions.length === 0 ? (
            <div className={styles.emptyState}>No positions registered yet.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Level</th>
                    <th>Position Title</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.id}>
                      <td>
                        <span className={styles.levelBadge}>{pos.level}</span>
                      </td>
                      <td>
                        <span className={styles.rowTitle}>{pos.name}</span>
                      </td>
                      <td>{pos.description || '—'}</td>
                      <td>
                        <span className={`status ${pos.isActive ? 'status-active' : 'status-ended'}`}>
                          {pos.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenPosModal(pos)}
                            title="Edit position"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleDeletePos(pos)}
                            title="Delete position"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ─── MODAL: CREATE / EDIT ORGANIZATION ───────────────────────────── */}
      {isOrgModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOrgModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>
                {editingOrg ? 'Edit Organization' : 'Create Organization'}
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsOrgModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOrg} className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label" htmlFor="org-name">
                  Organization Name *
                </label>
                <input
                  id="org-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Information Network Security Administration"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="org-desc">
                  Description
                </label>
                <textarea
                  id="org-desc"
                  className="form-input"
                  placeholder="Mandate and institutional scope"
                  value={orgDesc}
                  onChange={(e) => setOrgDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="org-logo">
                  Logo URL (Optional)
                </label>
                <input
                  id="org-logo"
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={orgLogo}
                  onChange={(e) => setOrgLogo(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsOrgModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingOrg ? 'Save Changes' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT UNIT ───────────────────────────────────── */}
      {isUnitModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsUnitModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>
                {editingUnit
                  ? 'Edit Organizational Unit'
                  : parentUnitForNew
                  ? `Add Sub-Unit under ${parentUnitForNew.name}`
                  : 'Add Top-Level Directorate'}
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsUnitModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label" htmlFor="unit-name">
                  Unit Name *
                </label>
                <input
                  id="unit-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Cyber Defense Directorate"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="unit-type">
                  Unit Type *
                </label>
                <select
                  id="unit-type"
                  className="form-input"
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as UnitType)}
                >
                  <option value={UnitType.DIRECTORATE}>Directorate</option>
                  <option value={UnitType.DEPUTY_DIRECTORATE}>Deputy Directorate</option>
                  <option value={UnitType.DIVISION}>Division</option>
                  <option value={UnitType.DEPARTMENT}>Department</option>
                  <option value={UnitType.TEAM}>Team</option>
                  <option value={UnitType.BRANCH}>Branch</option>
                  <option value={UnitType.OTHER}>Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="unit-desc">
                  Description
                </label>
                <textarea
                  id="unit-desc"
                  className="form-input"
                  placeholder="Unit responsibilities"
                  value={unitDesc}
                  onChange={(e) => setUnitDesc(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsUnitModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUnit ? 'Save Changes' : 'Add Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT POSITION ───────────────────────────────── */}
      {isPosModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsPosModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>
                {editingPos ? 'Edit Position' : 'Create Position'}
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsPosModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePos} className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label" htmlFor="pos-name">
                  Position Title *
                </label>
                <input
                  id="pos-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Division Head / Lead Security Architect"
                  value={posName}
                  onChange={(e) => setPosName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pos-level">
                  Hierarchical Level (1 = Top Rank, 99 = Entry) *
                </label>
                <input
                  id="pos-level"
                  type="number"
                  min="1"
                  max="99"
                  className="form-input"
                  value={posLevel}
                  onChange={(e) => setPosLevel(parseInt(e.target.value, 10) || 1)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', marginTop: '0.25rem', display: 'block' }}>
                  Lower number represents higher seniority (e.g., 1 = General Director, 3 = Division Head, 10 = Engineer).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pos-desc">
                  Description
                </label>
                <textarea
                  id="pos-desc"
                  className="form-input"
                  placeholder="Key responsibilities and qualifications"
                  value={posDesc}
                  onChange={(e) => setPosDesc(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsPosModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPos ? 'Save Position' : 'Create Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TOAST NOTIFICATION ─────────────────────────────────────────── */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? (
              <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
            ) : (
              <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

