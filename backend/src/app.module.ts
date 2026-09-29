import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';

// Config
import databaseConfig from './config/database.config.js';

// Entities
import { Organization } from './modules/organization/organization.entity.js';
import { OrganizationalUnit } from './modules/organizational-unit/organizational-unit.entity.js';
import { Position } from './modules/position/position.entity.js';
import { Employee } from './modules/employee/employee.entity.js';

// Modules
import { OrganizationModule } from './modules/organization/organization.module.js';
import { OrganizationalUnitModule } from './modules/organizational-unit/organizational-unit.module.js';
import { PositionModule } from './modules/position/position.module.js';
import { EmployeeModule } from './modules/employee/employee.module.js';

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

    // ── Event Bus (for audit logging later) ──────────────────────────────────
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
        entities:    [
          Organization,
          OrganizationalUnit,
          Position,
          Employee,
        ],
        synchronize: process.env.APP_ENV !== 'production',  // auto-migrate in dev only
        logging:     process.env.APP_ENV === 'development',
      }),
    }),

    // ── Feature Modules ──────────────────────────────────────────────────────
    OrganizationModule,
    OrganizationalUnitModule,
    PositionModule,
    EmployeeModule,
  ],
})
export class AppModule {}
