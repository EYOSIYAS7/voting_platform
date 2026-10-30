'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { employeesApi } from '@/lib/api/employees';
import { organizationsApi } from '@/lib/api/organizations';
import {
  Employee,
  EmployeeStatus,
  CreateEmployeeDto,
  OrganizationalUnit,
  Position,
  SystemRole,
  RoleEntity,
  UserRoleScope,
} from '@/lib/types/api';
import {
  Users,
  Plus,
  Search,
  KeyRound,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
  Copy,
  Lock,
} from 'lucide-react';
import styles from './employees.module.css';

const STATUS_BADGES: Record<EmployeeStatus, string> = {
  [EmployeeStatus.ACTIVE]: 'status-active',
  [EmployeeStatus.PENDING]: 'status-pending',
  [EmployeeStatus.INACTIVE]: 'status-ended',
  [EmployeeStatus.TERMINATED]: 'status-ended',
};

export default function EmployeesPage() {
  // ── Data State ─────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [units, setUnits] = useState<OrganizationalUnit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [systemRoles, setSystemRoles] = useState<RoleEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filters State ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | ''>('');

  // ── Toast Notification ───────────────────────────────────────────────────
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
  // Register Employee Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [empId, setEmpId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [unitId, setUnitId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [status, setStatus] = useState<EmployeeStatus>(EmployeeStatus.ACTIVE);
  const [hiredAt, setHiredAt] = useState('');

  // Account creation toggle in registration modal
  const [createAccountToo, setCreateAccountToo] = useState(true);
  const [tempPassword, setTempPassword] = useState('ChangeMe@123');

  // Edit Employee Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Credentials Generated Modal
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  // Role Management Modal
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [selectedEmpForRoles, setSelectedEmpForRoles] = useState<Employee | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleScope[]>([]);
  const [assignRoleId, setAssignRoleId] = useState('');
  const [assignOrgUnitId, setAssignOrgUnitId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // ── Fetch Initial Data ────────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await employeesApi.getEmployees({
        search: searchQuery.trim() || undefined,
        unitId: selectedUnitId || undefined,
        positionId: selectedPositionId || undefined,
        status: (selectedStatus as EmployeeStatus) || undefined,
      });
      setEmployees(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch employees', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedUnitId, selectedPositionId, selectedStatus]);

  useEffect(() => {
    async function loadAuxData() {
      try {
        const [orgs, posList, rolesList] = await Promise.all([
          organizationsApi.getOrganizations().catch(() => []),
          organizationsApi.getPositions().catch(() => []),
          employeesApi.getRoles().catch(() => []),
        ]);
        setPositions(posList);
        setSystemRoles(rolesList);

        if (orgs.length > 0) {
          const allUnits = await organizationsApi.getOrgUnits(orgs[0].id).catch(() => []);
          setUnits(allUnits);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load system references', 'error');
      }
    }
    loadAuxData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployees();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadEmployees]);

  // ── Register Handler ──────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !empId || !unitId) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      const dto: CreateEmployeeDto = {
        employeeId: empId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        organizationalUnitId: unitId,
        positionId: positionId || undefined,
        status,
        hiredAt: hiredAt ? new Date(hiredAt).toISOString() : undefined,
      };

      const newEmp = await employeesApi.createEmployee(dto);

      // If "also create login account" is checked
      if (createAccountToo) {
        try {
          await employeesApi.createAccount({
            employeeId: newEmp.id,
            temporaryPassword: tempPassword,
          });

          setCreatedCredentials({
            name: `${newEmp.firstName} ${newEmp.lastName}`,
            email: newEmp.email,
            password: tempPassword,
          });
        } catch (accErr: any) {
          showToast(`Employee created, but account creation failed: ${accErr.message}`, 'error');
        }
      } else {
        showToast('Employee registered successfully', 'success');
      }

      setIsRegisterModalOpen(false);
      resetRegisterForm();
      loadEmployees();
    } catch (err: any) {
      showToast(err.message || 'Failed to register employee', 'error');
    }
  };

  const resetRegisterForm = () => {
    setEmpId('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setUnitId('');
    setPositionId('');
    setStatus(EmployeeStatus.ACTIVE);
    setHiredAt('');
    setCreateAccountToo(true);
    setTempPassword('ChangeMe@123');
  };

  // ── Edit Handler ──────────────────────────────────────────────────────────
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setEmail(emp.email);
    setPhone(emp.phone || '');
    setUnitId(emp.organizationalUnitId);
    setPositionId(emp.positionId || '');
    setStatus(emp.status);
    setHiredAt(emp.hiredAt ? emp.hiredAt.split('T')[0] : '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      await employeesApi.updateEmployee(editingEmployee.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        organizationalUnitId: unitId,
        positionId: positionId || undefined,
        status,
        hiredAt: hiredAt ? new Date(hiredAt).toISOString() : undefined,
      });

      showToast('Employee updated successfully', 'success');
      setIsEditModalOpen(false);
      loadEmployees();
    } catch (err: any) {
      showToast(err.message || 'Failed to update employee', 'error');
    }
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (!confirm(`Are you sure you want to remove employee "${emp.firstName} ${emp.lastName}"?`)) return;

    try {
      await employeesApi.deleteEmployee(emp.id);
      showToast('Employee record deleted', 'success');
      loadEmployees();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete employee record', 'error');
    }
  };

  // ── Role Management Handlers ──────────────────────────────────────────────
  const handleOpenRoles = async (emp: Employee) => {
    setSelectedEmpForRoles(emp);
    setIsRolesModalOpen(true);
    try {
      const roles = await employeesApi.getUserRoles(emp.id).catch(() => []);
      setUserRoles(roles);
    } catch {
      setUserRoles([]);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForRoles || !assignRoleId) return;

    setIsAssigning(true);
    try {
      await employeesApi.assignRole({
        userId: selectedEmpForRoles.id,
        roleId: assignRoleId,
        orgUnitId: assignOrgUnitId || undefined,
      });
      showToast('Role scope assigned successfully', 'success');
      const updatedRoles = await employeesApi.getUserRoles(selectedEmpForRoles.id);
      setUserRoles(updatedRoles);
      setAssignRoleId('');
      setAssignOrgUnitId('');
    } catch (err: any) {
      showToast(err.message || 'Failed to assign role', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevokeRole = async (scopeId: string) => {
    if (!confirm('Are you sure you want to revoke this role scope?')) return;

    try {
      await employeesApi.revokeRole(scopeId);
      showToast('Role scope revoked', 'success');
      if (selectedEmpForRoles) {
        const updatedRoles = await employeesApi.getUserRoles(selectedEmpForRoles.id);
        setUserRoles(updatedRoles);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke role', 'error');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Employees & Identity Access</h1>
          <p className={styles.subtitle}>
            Register personnel, manage organizational placement, issue login accounts, and assign role scopes.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            resetRegisterForm();
            setIsRegisterModalOpen(true);
          }}
        >
          <Plus size={16} />
          <span>Register Employee</span>
        </button>
      </header>

      {/* Filter Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="search"
            className={`form-input ${styles.searchInput}`}
            placeholder="Search by name, email, or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className={`form-input ${styles.filterSelect}`}
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value)}
        >
          <option value="">All Units</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <select
          className={`form-input ${styles.filterSelect}`}
          value={selectedPositionId}
          onChange={(e) => setSelectedPositionId(e.target.value)}
        >
          <option value="">All Positions</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (Lvl {p.level})
            </option>
          ))}
        </select>

        <select
          className={`form-input ${styles.filterSelect}`}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as EmployeeStatus)}
        >
          <option value="">All Statuses</option>
          <option value={EmployeeStatus.ACTIVE}>Active</option>
          <option value={EmployeeStatus.PENDING}>Pending</option>
          <option value={EmployeeStatus.INACTIVE}>Inactive</option>
          <option value={EmployeeStatus.TERMINATED}>Terminated</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className={styles.tablePanel}>
        <div className={styles.tableWrapper}>
          {isLoading ? (
            <div style={{ padding: '3.5rem', display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          ) : employees.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p>No employees found matching the selected filters.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID Number</th>
                  <th>Unit Placement</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Hired Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const empPos = positions.find((p) => p.id === emp.positionId);
                  const empUnit = units.find((u) => u.id === emp.organizationalUnitId);

                  return (
                    <tr key={emp.id}>
                      <td>
                        <span className={styles.empName}>
                          {emp.firstName} {emp.lastName}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-3)' }}>
                          {emp.email}
                        </span>
                      </td>
                      <td>
                        <span className={styles.empId}>{emp.employeeId}</span>
                      </td>
                      <td>{empUnit ? empUnit.name : '—'}</td>
                      <td>
                        {empPos ? (
                          <>
                            <span>{empPos.name}</span>
                            <span className={styles.levelTag}>L{empPos.level}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span className={`status ${STATUS_BADGES[emp.status]}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {emp.hiredAt ? new Date(emp.hiredAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenRoles(emp)}
                            title="Manage roles & access"
                          >
                            <KeyRound size={14} />
                            <span>Roles</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenEdit(emp)}
                            title="Edit details"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleDeleteEmployee(emp)}
                            title="Delete employee"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── MODAL: REGISTER EMPLOYEE ────────────────────────────────────── */}
      {isRegisterModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsRegisterModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>Register New Personnel</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsRegisterModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegister} className="formGrid">
              <div className={styles.formGrid2}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-first">
                    First Name *
                  </label>
                  <input
                    id="reg-first"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Eyosiyas"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-last">
                    Last Name *
                  </label>
                  <input
                    id="reg-last"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Tesfaye"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-id">
                    Employee HR ID *
                  </label>
                  <input
                    id="reg-id"
                    type="text"
                    className="form-input"
                    placeholder="e.g. INSA-1029"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">
                    Institutional Email *
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    className="form-input"
                    placeholder="name@insa.gov.et"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-unit">
                    Organizational Unit *
                  </label>
                  <select
                    id="reg-unit"
                    className="form-input"
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    required
                  >
                    <option value="">Select Directorate / Division...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.unitType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-pos">
                    Position Rank
                  </label>
                  <select
                    id="reg-pos"
                    className="form-input"
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value)}
                  >
                    <option value="">Select Position...</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Level {p.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">
                    Phone Number
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="form-input"
                    placeholder="+251 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-hired">
                    Hired Date
                  </label>
                  <input
                    id="reg-hired"
                    type="date"
                    className="form-input"
                    value={hiredAt}
                    onChange={(e) => setHiredAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Account Provisioning Option */}
              <div className={styles.accountSection}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={createAccountToo}
                    onChange={(e) => setCreateAccountToo(e.target.checked)}
                  />
                  <span>Provision Portal Login Account Immediately</span>
                </label>

                {createAccountToo && (
                  <div style={{ marginTop: '0.85rem' }}>
                    <label className="form-label" htmlFor="reg-pass">
                      Temporary Password (User will change on 1st login)
                    </label>
                    <input
                      id="reg-pass"
                      type="text"
                      className="form-input"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsRegisterModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT EMPLOYEE ────────────────────────────────────────── */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>Edit Employee Record</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="formGrid">
              <div className={styles.formGrid2}>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-first">
                    First Name *
                  </label>
                  <input
                    id="edit-first"
                    type="text"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-last">
                    Last Name *
                  </label>
                  <input
                    id="edit-last"
                    type="text"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-email">
                    Institutional Email *
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-status">
                    Employment Status
                  </label>
                  <select
                    id="edit-status"
                    className="form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                  >
                    <option value={EmployeeStatus.ACTIVE}>Active</option>
                    <option value={EmployeeStatus.PENDING}>Pending</option>
                    <option value={EmployeeStatus.INACTIVE}>Inactive</option>
                    <option value={EmployeeStatus.TERMINATED}>Terminated</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-unit">
                    Organizational Unit *
                  </label>
                  <select
                    id="edit-unit"
                    className="form-input"
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    required
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.unitType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-pos">
                    Position Rank
                  </label>
                  <select
                    id="edit-pos"
                    className="form-input"
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value)}
                  >
                    <option value="">None</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Level {p.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREDENTIALS GENERATED CARD ──────────────────────────── */}
      {createdCredentials && (
        <div className={styles.modalOverlay} onClick={() => setCreatedCredentials(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle} style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={20} />
                <span>Account Created</span>
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setCreatedCredentials(null)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--color-text-2)' }}>
              A secure portal account was provisioned for <strong>{createdCredentials.name}</strong>.
              Deliver these credentials securely to the employee. They will be required to change their password on first login.
            </p>

            <div className={styles.credentialsCard}>
              <div className={styles.credRow}>
                <strong>Login Email:</strong>
                <code>{createdCredentials.email}</code>
              </div>
              <div className={styles.credRow}>
                <strong>Temporary Password:</strong>
                <code>{createdCredentials.password}</code>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `INSA E-Voting Portal Credentials:\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.password}\nLogin URL: http://localhost:3000/`
                  );
                  showToast('Credentials copied to clipboard', 'success');
                  setCreatedCredentials(null);
                }}
              >
                <Copy size={15} />
                <span>Copy & Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ROLE SCOPES MANAGEMENT ──────────────────────────────── */}
      {isRolesModalOpen && selectedEmpForRoles && (
        <div className={styles.modalOverlay} onClick={() => setIsRolesModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>
                Manage Role Scopes: {selectedEmpForRoles.firstName} {selectedEmpForRoles.lastName}
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsRolesModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.825rem', color: 'var(--color-text-2)' }}>
              Assign or revoke administrative role scopes for this employee.
            </p>

            <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.875rem' }}>Active Role Scopes:</h4>

            {userRoles.length === 0 ? (
              <div style={{ padding: '1rem', background: 'var(--color-elevated)', borderRadius: '6px', fontSize: '0.825rem', color: 'var(--color-text-3)' }}>
                No custom administrative roles assigned. Employee has standard voter access.
              </div>
            ) : (
              <div className={styles.rolesList}>
                {userRoles.map((r, idx) => {
                  const scopeUnit = units.find((u) => u.id === r.orgUnitId);
                  const roleName =
                    typeof r.role === 'object' && r.role !== null
                      ? (r.role as any).name
                      : r.role;

                  return (
                    <div key={r.id || idx} className={styles.roleItem}>
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--color-accent)' }}>
                          {roleName}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', display: 'block' }}>
                          {r.orgUnitId ? `Scoped to: ${scopeUnit?.name || r.orgUnitId}` : 'Global Scope (All Units)'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => handleRevokeRole(r.id || '')}
                        title="Revoke role"
                      >
                        Revoke
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Assign Form */}
            <form onSubmit={handleAssignRole} style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem' }}>Assign New Role Scope:</h4>

              <div className={styles.formGrid2}>
                <div className="form-group">
                  <label className="form-label" htmlFor="role-select">
                    Role *
                  </label>
                  <select
                    id="role-select"
                    className="form-input"
                    value={assignRoleId}
                    onChange={(e) => setAssignRoleId(e.target.value)}
                    required
                  >
                    <option value="">Select Role...</option>
                    {systemRoles.map((sr) => (
                      <option key={sr.id} value={sr.id}>
                        {sr.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="scope-unit">
                    Unit Scope (Optional)
                  </label>
                  <select
                    id="scope-unit"
                    className="form-input"
                    value={assignOrgUnitId}
                    onChange={(e) => setAssignOrgUnitId(e.target.value)}
                  >
                    <option value="">Global (All Units)</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsRolesModalOpen(false)}
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={isAssigning || !assignRoleId}>
                  {isAssigning ? 'Assigning...' : 'Assign Role Scope'}
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

