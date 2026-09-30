import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../casl/ability.factory.js';
export declare class PermissionsGuard implements CanActivate {
    private readonly reflector;
    private readonly abilityFactory;
    constructor(reflector: Reflector, abilityFactory: AbilityFactory);
    canActivate(context: ExecutionContext): boolean;
}
