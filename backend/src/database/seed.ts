/**
 * Seed Script — Phase 2
 * Populates:
 * 1. Default system permissions
 * 2. Default system roles
 * 3. Initial Super Admin (Organization, Unit, Position, Employee, UserAccount, UserRoleScope)
 *
 * Run with:
 *   pnpm run seed
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const envPath = join(__dirname, '../../.env');
if (existsSync(envPath) && typeof (process as any).loadEnvFile === 'function') {
  (process as any).loadEnvFile(envPath);
}

// ── Entities ─────────────────────────────────────────────────────────────────
import { Organization } from '../modules/organization/organization.entity.js';
import { OrganizationalUnit, UnitType } from '../modules/organizational-unit/organizational-unit.entity.js';
import { Position } from '../modules/position/position.entity.js';
import { Employee, EmployeeStatus } from '../modules/employee/employee.entity.js';
import { Role, SystemRole } from '../modules/auth/entities/role.entity.js';
import { Permission } from '../modules/auth/entities/permission.entity.js';
import { UserAccount } from '../modules/auth/entities/user-account.entity.js';
import { UserRoleScope } from '../modules/auth/entities/user-role-scope.entity.js';
import { WalletBinding } from '../modules/auth/entities/wallet-binding.entity.js';

// ── Define default permissions ────────────────────────────────────────────────
const DEFAULT_PERMISSIONS: Array<{ action: string; resource: string; description: string }> = [
  // Organization
  { action: 'create', resource: 'organization',        description: 'Create organizations' },
  { action: 'read',   resource: 'organization',        description: 'View organizations' },
  { action: 'update', resource: 'organization',        description: 'Update organizations' },
  { action: 'delete', resource: 'organization',        description: 'Delete organizations' },
  { action: 'manage', resource: 'organization',        description: 'Full control over organizations' },

  // Organizational Unit
  { action: 'create', resource: 'organizational-unit', description: 'Create org units' },
  { action: 'read',   resource: 'organizational-unit', description: 'View org units' },
  { action: 'update', resource: 'organizational-unit', description: 'Update org units' },
  { action: 'delete', resource: 'organizational-unit', description: 'Delete org units' },

  // Position
  { action: 'create', resource: 'position',            description: 'Create positions' },
  { action: 'read',   resource: 'position',            description: 'View positions' },
  { action: 'update', resource: 'position',            description: 'Update positions' },
  { action: 'delete', resource: 'position',            description: 'Delete positions' },

  // Employee
  { action: 'create', resource: 'employee',            description: 'Create employees' },
  { action: 'read',   resource: 'employee',            description: 'View employees' },
  { action: 'update', resource: 'employee',            description: 'Update employees' },
  { action: 'delete', resource: 'employee',            description: 'Delete employees' },

  // Election
  { action: 'create', resource: 'election',            description: 'Create elections' },
  { action: 'read',   resource: 'election',            description: 'View elections' },
  { action: 'update', resource: 'election',            description: 'Update elections' },
  { action: 'delete', resource: 'election',            description: 'Delete elections' },

  // Candidate
  { action: 'create', resource: 'candidate',           description: 'Add candidates' },
  { action: 'read',   resource: 'candidate',           description: 'View candidates' },
  { action: 'update', resource: 'candidate',           description: 'Update candidates' },
  { action: 'delete', resource: 'candidate',           description: 'Remove candidates' },

  // Eligibility
  { action: 'create', resource: 'eligibility',         description: 'Define eligibility rules' },
  { action: 'read',   resource: 'eligibility',         description: 'View eligibility rules' },
  { action: 'delete', resource: 'eligibility',         description: 'Remove eligibility rules' },

  // Vote
  { action: 'create', resource: 'vote',                description: 'Cast a vote' },

  // Result
  { action: 'read',   resource: 'result',              description: 'View election results' },

  // Audit
  { action: 'read',   resource: 'audit',               description: 'View audit logs' },

  // Wallet binding
  { action: 'create', resource: 'wallet-binding',      description: 'Bind a wallet' },
  { action: 'read',   resource: 'wallet-binding',      description: 'View wallet binding' },
  { action: 'delete', resource: 'wallet-binding',      description: 'Revoke wallet binding' },

  // Profile
  { action: 'read',   resource: 'profile',             description: 'View own profile' },
  { action: 'update', resource: 'profile',             description: 'Update own profile' },
];

// ── Define default roles ──────────────────────────────────────────────────────
const DEFAULT_ROLES: Array<{ name: SystemRole; description: string }> = [
  {
    name:        SystemRole.SYSTEM_ADMIN,
    description: 'Full system administrator. Can manage all resources, users, and roles.',
  },
  {
    name:        SystemRole.ELECTION_ADMIN,
    description: 'Manages elections, candidates, and eligibility. Can be scoped to an org unit.',
  },
  {
    name:        SystemRole.EMPLOYEE,
    description: 'Regular employee. Can view eligible elections and cast votes.',
  },
  {
    name:        SystemRole.AUDITOR,
    description: 'Read-only access to elections, results, and audit logs.',
  },
];

// ── Bootstrap DataSource ──────────────────────────────────────────────────────
const dataSource = new DataSource({
  type:        'postgres',
  host:        process.env.DB_HOST     ?? 'localhost',
  port:        parseInt(process.env.DB_PORT ?? '5435', 10),
  username:    process.env.DB_USERNAME ?? 'postgres',
  password:    process.env.DB_PASSWORD ?? 'password',
  database:    process.env.DB_DATABASE ?? 'voting_platform',
  entities: [
    Organization,
    OrganizationalUnit,
    Position,
    Employee,
    Role,
    Permission,
    UserAccount,
    UserRoleScope,
    WalletBinding,
  ],
  synchronize: true,
  logging:     false,
});

async function seed() {
  await dataSource.initialize();
  console.log('✅ Database connected');

  const roleRepo       = dataSource.getRepository(Role);
  const permissionRepo = dataSource.getRepository(Permission);
  const orgRepo        = dataSource.getRepository(Organization);
  const unitRepo       = dataSource.getRepository(OrganizationalUnit);
  const positionRepo   = dataSource.getRepository(Position);
  const employeeRepo   = dataSource.getRepository(Employee);
  const accountRepo    = dataSource.getRepository(UserAccount);
  const scopeRepo      = dataSource.getRepository(UserRoleScope);

  // ── 1. Seed Permissions ─────────────────────────────────────────────────────
  console.log('\n📋 Seeding permissions...');
  for (const p of DEFAULT_PERMISSIONS) {
    const name     = `${p.action}:${p.resource}`;
    const existing = await permissionRepo.findOne({ where: { name } });
    if (!existing) {
      await permissionRepo.save(permissionRepo.create({ ...p, name }));
      console.log(`   ➕ Created: ${name}`);
    } else {
      console.log(`   ✓  Exists:  ${name}`);
    }
  }

  // ── 2. Seed Roles ───────────────────────────────────────────────────────────
  console.log('\n👥 Seeding roles...');
  for (const r of DEFAULT_ROLES) {
    const existing = await roleRepo.findOne({ where: { name: r.name } });
    if (!existing) {
      await roleRepo.save(roleRepo.create(r));
      console.log(`   ➕ Created: ${r.name}`);
    } else {
      console.log(`   ✓  Exists:  ${r.name}`);
    }
  }

  // ── 3. Seed Initial Super Admin ─────────────────────────────────────────────
  console.log('\n👑 Seeding Initial Super Admin for Information Network Security Administration...');
  const adminEmail    = process.env.ADMIN_EMAIL    ?? 'admin@insa.gov.et';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123456';

  let employee = await employeeRepo.findOne({ where: { email: adminEmail } });

  if (!employee) {
    // 3a. Ensure Organization exists
    let org = await orgRepo.findOne({ where: { name: 'Information Network Security Administration' } });
    if (!org) {
      org = await orgRepo.save(
        orgRepo.create({
          name: 'Information Network Security Administration',
          description: 'National Cybersecurity and Intelligence Institution',
          status: 'ACTIVE',
        }),
      );
      console.log(`   ➕ Created Organization: ${org.name}`);
    } else {
      console.log(`   ✓  Organization exists: ${org.name}`);
    }

    // 3b. Ensure Root Unit exists (Director General Office)
    let unit = await unitRepo.findOne({ where: { name: 'Director General Office', organizationId: org.id } });
    if (!unit) {
      unit = await unitRepo.save(
        unitRepo.create({
          name: 'Director General Office',
          description: 'Executive Office of the Director General',
          unitType: UnitType.DIRECTORATE,
          organizationId: org.id,
          status: 'ACTIVE',
        }),
      );
      console.log(`   ➕ Created Unit: ${unit.name}`);
    } else {
      console.log(`   ✓  Unit exists: ${unit.name}`);
    }

    // 3c. Ensure Position exists
    let position = await positionRepo.findOne({ where: { name: 'System Administrator' } });
    if (!position) {
      position = await positionRepo.save(
        positionRepo.create({
          name: 'System Administrator',
          description: 'Primary Platform and IT Systems Administrator',
          level: 1,
          isActive: true,
        }),
      );
      console.log(`   ➕ Created Position: ${position.name}`);
    } else {
      console.log(`   ✓  Position exists: ${position.name}`);
    }

    // 3d. Create Employee
    employee = await employeeRepo.save(
      employeeRepo.create({
        employeeId: 'INSA-0001',
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        organizationalUnitId: unit.id,
        positionId: position.id,
        status: EmployeeStatus.ACTIVE,
      }),
    );
    console.log(`   ➕ Created Admin Employee: ${employee.email}`);
  } else {
    console.log(`   ✓  Admin Employee exists: ${employee.email}`);
  }

  // 3e. Ensure UserAccount exists
  let account = await accountRepo.findOne({ where: { employeeId: employee.id } });
  if (!account) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    account = await accountRepo.save(
      accountRepo.create({
        employeeId: employee.id,
        passwordHash,
        mustChangePassword: false,
        isActive: true,
      }),
    );
    console.log(`   ➕ Created UserAccount for: ${adminEmail}`);
  } else {
    console.log(`   ✓  UserAccount exists for: ${adminEmail}`);
  }

  // 3f. Assign SYSTEM_ADMIN role globally
  const sysAdminRole = await roleRepo.findOne({ where: { name: SystemRole.SYSTEM_ADMIN } });
  if (sysAdminRole) {
    const existingScope = await scopeRepo.findOne({
      where: { userId: account.id, roleId: sysAdminRole.id },
    });
    if (!existingScope) {
      await scopeRepo.save(
        scopeRepo.create({
          userId: account.id,
          roleId: sysAdminRole.id,
          orgUnitId: null, // global scope
          grantedBy: 'SYSTEM_BOOTSTRAP',
        }),
      );
      console.log(`   ➕ Assigned SYSTEM_ADMIN role to: ${adminEmail}`);
    } else {
      console.log(`   ✓  SYSTEM_ADMIN role already assigned`);
    }
  }

  await dataSource.destroy();
  console.log('\n🎉 Seed completed successfully!');
  console.log(`\n🔑 Initial Super Admin Credentials:`);
  console.log(`   Organization: Information Network Security Administration`);
  console.log(`   Email:        ${adminEmail}`);
  console.log(`   Password:     ${adminPassword}\n`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
