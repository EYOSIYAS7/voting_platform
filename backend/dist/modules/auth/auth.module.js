var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserAccount } from './entities/user-account.entity.js';
import { Role } from './entities/role.entity.js';
import { Permission } from './entities/permission.entity.js';
import { UserRoleScope } from './entities/user-role-scope.entity.js';
import { WalletBinding } from './entities/wallet-binding.entity.js';
import { Employee } from '../employee/employee.entity.js';
import { LocalStrategy } from './strategies/local.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { AbilityFactory } from './casl/ability.factory.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
let AuthModule = class AuthModule {
};
AuthModule = __decorate([
    Module({
        imports: [
            PassportModule.register({ defaultStrategy: 'jwt' }),
            JwtModule.registerAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET'),
                    signOptions: { expiresIn: (config.get('JWT_EXPIRES_IN') ?? '8h') },
                }),
            }),
            TypeOrmModule.forFeature([
                UserAccount,
                Role,
                Permission,
                UserRoleScope,
                WalletBinding,
                Employee,
            ]),
        ],
        providers: [
            AuthService,
            AbilityFactory,
            LocalStrategy,
            JwtStrategy,
            JwtAuthGuard,
            LocalAuthGuard,
            PermissionsGuard,
        ],
        controllers: [AuthController],
        exports: [
            AuthService,
            AbilityFactory,
            JwtAuthGuard,
            PermissionsGuard,
            JwtModule,
        ],
    })
], AuthModule);
export { AuthModule };
//# sourceMappingURL=auth.module.js.map