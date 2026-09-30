import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { AuthenticatedUser } from '../../../common/types/jwt-payload.types.js';
import { SystemRole } from '../entities/role.entity.js';

export type AppAbility = MongoAbility;

/**
 * Defines what each system role is allowed to do.
 *
 * SYSTEM_ADMIN   → can manage everything
 * ELECTION_ADMIN → can manage elections + candidates + view employees
 * EMPLOYEE       → can read elections they are eligible for, cast votes
 * AUDITOR        → read-only access to elections, results, audit logs
 */
@Injectable()
export class AbilityFactory {
  createForUser(user: AuthenticatedUser): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    const roles = user.roles ?? [];

    if (roles.includes(SystemRole.SYSTEM_ADMIN)) {
      // Full access
      can('manage', 'all');
    }

    if (roles.includes(SystemRole.ELECTION_ADMIN)) {
      // Organization structure — read only
      can('read', 'organization');
      can('read', 'organizational-unit');
      can('read', 'position');
      can('read', 'employee');

      // Election lifecycle
      can('create', 'election');
      can('read',   'election');
      can('update', 'election');
      can('delete', 'election');

      // Candidate management
      can('create', 'candidate');
      can('read',   'candidate');
      can('update', 'candidate');
      can('delete', 'candidate');

      // Eligibility engine
      can('create', 'eligibility');
      can('read',   'eligibility');
      can('delete', 'eligibility');

      // Audit — read access
      can('read', 'audit');
      can('read', 'result');
    }

    if (roles.includes(SystemRole.EMPLOYEE)) {
      // Self-service
      can('read', 'election');          // elections they are eligible for
      can('create', 'vote');            // cast vote (enforced by eligibility engine)
      can('read', 'result');            // view results of completed elections
      can('read', 'profile');           // own profile
      can('update', 'profile');         // update own profile
      can('create', 'wallet-binding'); // bind their own wallet
      can('read',   'wallet-binding'); // view own binding
      // Candidate self-service
      can('read',   'candidate');       // view approved candidates for any election
      can('create', 'candidate');       // self-nominate
      can('update', 'candidate');       // update own pending candidacy
    }

    if (roles.includes(SystemRole.AUDITOR)) {
      can('read', 'election');
      can('read', 'result');
      can('read', 'audit');
      can('read', 'organization');
      can('read', 'organizational-unit');
      can('read', 'employee');

      // Auditors can never mutate anything
      cannot('create', 'all');
      cannot('update', 'all');
      cannot('delete', 'all');
    }

    return build();
  }
}
