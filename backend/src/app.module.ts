import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';

// Config
import databaseConfig from './config/database.config.js';

// Phase 1 Entities
import { Organization } from './modules/organization/organization.entity.js';
import { OrganizationalUnit } from './modules/organizational-unit/organizational-unit.entity.js';
import { Position } from './modules/position/position.entity.js';
import { Employee } from './modules/employee/employee.entity.js';

// Phase 2 Entities
import { UserAccount } from './modules/auth/entities/user-account.entity.js';
import { Role } from './modules/auth/entities/role.entity.js';
import { Permission } from './modules/auth/entities/permission.entity.js';
import { UserRoleScope } from './modules/auth/entities/user-role-scope.entity.js';
import { WalletBinding } from './modules/auth/entities/wallet-binding.entity.js';

// Phase 3 Entities
import { Election } from './modules/election/entities/election.entity.js';
import { EligibilityRule } from './modules/election/entities/eligibility-rule.entity.js';
import { ElectionVoter } from './modules/election/entities/election-voter.entity.js';

// Phase 4 Entities
import { Candidate } from './modules/candidate/entities/candidate.entity.js';

// Phase 1 Feature Modules
import { OrganizationModule } from './modules/organization/organization.module.js';
import { OrganizationalUnitModule } from './modules/organizational-unit/organizational-unit.module.js';
import { PositionModule } from './modules/position/position.module.js';
import { EmployeeModule } from './modules/employee/employee.module.js';

// Phase 2 Feature Modules
import { AuthModule } from './modules/auth/auth.module.js';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';

// Phase 3 Feature Modules
import { ElectionModule } from './modules/election/election.module.js';

// Phase 4 Feature Modules
import { CandidateModule } from './modules/candidate/candidate.module.js';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal:    true,
      load:        [databaseConfig],
      envFilePath: '.env',
    }),

    // ── Rate Limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 100 },   // 100 requests per minute globally
    ]),

    // ── Event Bus (audit logging) ─────────────────────────────────────────────
    EventEmitterModule.forRoot(),

    // ── Database ─────────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (config: ConfigService) => ({
        type:        'postgres',
        host:        config.get<string>('database.host'),
        port:        config.get<number>('database.port'),
        username:    config.get<string>('database.username'),
        password:    config.get<string>('database.password'),
        database:    config.get<string>('database.database'),
        entities: [
          // Phase 1
          Organization,
          OrganizationalUnit,
          Position,
          Employee,
          // Phase 2
          UserAccount,
          Role,
          Permission,
          UserRoleScope,
          WalletBinding,
          // Phase 3
          Election,
          EligibilityRule,
          ElectionVoter,
          // Phase 4
          Candidate,
        ],
        synchronize: process.env.APP_ENV !== 'production',  // auto-migrate in dev only
        logging:     process.env.APP_ENV === 'development',
      }),
    }),

    // ── Feature Modules ──────────────────────────────────────────────────────
    // Phase 1
    OrganizationModule,
    OrganizationalUnitModule,
    PositionModule,
    EmployeeModule,

    // Phase 2
    AuthModule,

    // Phase 3
    ElectionModule,

    // Phase 4
    CandidateModule,
  ],

  providers: [
    // ── Global JWT guard — all routes require auth unless decorated @Public() ─
    {
      provide:  APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
