var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import databaseConfig from './config/database.config.js';
import { Organization } from './modules/organization/organization.entity.js';
import { OrganizationalUnit } from './modules/organizational-unit/organizational-unit.entity.js';
import { Position } from './modules/position/position.entity.js';
import { Employee } from './modules/employee/employee.entity.js';
import { UserAccount } from './modules/auth/entities/user-account.entity.js';
import { Role } from './modules/auth/entities/role.entity.js';
import { Permission } from './modules/auth/entities/permission.entity.js';
import { UserRoleScope } from './modules/auth/entities/user-role-scope.entity.js';
import { WalletBinding } from './modules/auth/entities/wallet-binding.entity.js';
import { Election } from './modules/election/entities/election.entity.js';
import { EligibilityRule } from './modules/election/entities/eligibility-rule.entity.js';
import { ElectionVoter } from './modules/election/entities/election-voter.entity.js';
import { Candidate } from './modules/candidate/entities/candidate.entity.js';
import { OrganizationModule } from './modules/organization/organization.module.js';
import { OrganizationalUnitModule } from './modules/organizational-unit/organizational-unit.module.js';
import { PositionModule } from './modules/position/position.module.js';
import { EmployeeModule } from './modules/employee/employee.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';
import { ElectionModule } from './modules/election/election.module.js';
import { CandidateModule } from './modules/candidate/candidate.module.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                load: [databaseConfig],
                envFilePath: '.env',
            }),
            ThrottlerModule.forRoot([
                { ttl: 60_000, limit: 100 },
            ]),
            EventEmitterModule.forRoot(),
            TypeOrmModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('database.host'),
                    port: config.get('database.port'),
                    username: config.get('database.username'),
                    password: config.get('database.password'),
                    database: config.get('database.database'),
                    entities: [
                        Organization,
                        OrganizationalUnit,
                        Position,
                        Employee,
                        UserAccount,
                        Role,
                        Permission,
                        UserRoleScope,
                        WalletBinding,
                        Election,
                        EligibilityRule,
                        ElectionVoter,
                        Candidate,
                    ],
                    synchronize: process.env.APP_ENV !== 'production',
                    logging: process.env.APP_ENV === 'development',
                }),
            }),
            OrganizationModule,
            OrganizationalUnitModule,
            PositionModule,
            EmployeeModule,
            AuthModule,
            ElectionModule,
            CandidateModule,
        ],
        providers: [
            {
                provide: APP_GUARD,
                useClass: JwtAuthGuard,
            },
        ],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map