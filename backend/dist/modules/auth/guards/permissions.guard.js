var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, ForbiddenException, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../../common/decorators/require-permissions.decorator.js';
import { AbilityFactory } from '../casl/ability.factory.js';
let PermissionsGuard = class PermissionsGuard {
    reflector;
    abilityFactory;
    constructor(reflector, abilityFactory) {
        this.reflector = reflector;
        this.abilityFactory = abilityFactory;
    }
    canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermissions || requiredPermissions.length === 0)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            throw new ForbiddenException('No authenticated user');
        const ability = this.abilityFactory.createForUser(user);
        for (const perm of requiredPermissions) {
            const [action, resource] = perm.split(':');
            if (!ability.can(action, resource)) {
                throw new ForbiddenException(`You do not have permission to "${perm}"`);
            }
        }
        return true;
    }
};
PermissionsGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Reflector,
        AbilityFactory])
], PermissionsGuard);
export { PermissionsGuard };
//# sourceMappingURL=permissions.guard.js.map