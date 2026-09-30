var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { SystemRole } from '../entities/role.entity.js';
let AbilityFactory = class AbilityFactory {
    createForUser(user) {
        const { can, cannot, build } = new AbilityBuilder(createMongoAbility);
        const roles = user.roles ?? [];
        if (roles.includes(SystemRole.SYSTEM_ADMIN)) {
            can('manage', 'all');
        }
        if (roles.includes(SystemRole.ELECTION_ADMIN)) {
            can('read', 'organization');
            can('read', 'organizational-unit');
            can('read', 'position');
            can('read', 'employee');
            can('create', 'election');
            can('read', 'election');
            can('update', 'election');
            can('delete', 'election');
            can('create', 'candidate');
            can('read', 'candidate');
            can('update', 'candidate');
            can('delete', 'candidate');
            can('create', 'eligibility');
            can('read', 'eligibility');
            can('delete', 'eligibility');
            can('read', 'audit');
            can('read', 'result');
        }
        if (roles.includes(SystemRole.EMPLOYEE)) {
            can('read', 'election');
            can('create', 'vote');
            can('read', 'result');
            can('read', 'profile');
            can('update', 'profile');
            can('create', 'wallet-binding');
            can('read', 'wallet-binding');
            can('read', 'candidate');
            can('create', 'candidate');
            can('update', 'candidate');
        }
        if (roles.includes(SystemRole.AUDITOR)) {
            can('read', 'election');
            can('read', 'result');
            can('read', 'audit');
            can('read', 'organization');
            can('read', 'organizational-unit');
            can('read', 'employee');
            cannot('create', 'all');
            cannot('update', 'all');
            cannot('delete', 'all');
        }
        return build();
    }
};
AbilityFactory = __decorate([
    Injectable()
], AbilityFactory);
export { AbilityFactory };
//# sourceMappingURL=ability.factory.js.map