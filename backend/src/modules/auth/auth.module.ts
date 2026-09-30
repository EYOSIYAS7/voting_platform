import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { UserAccount } from './entities/user-account.entity.js';
import { Role } from './entities/role.entity.js';
import { Permission } from './entities/permission.entity.js';
import { UserRoleScope } from './entities/user-role-scope.entity.js';
import { WalletBinding } from './entities/wallet-binding.entity.js';
import { Employee } from '../employee/employee.entity.js';

// Strategies & Guards
import { LocalStrategy } from './strategies/local.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';

// CASL
import { AbilityFactory } from './casl/ability.factory.js';

// Service & Controller
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '8h') as any },
      }),
    }),

    TypeOrmModule.forFeature([
      UserAccount,
      Role,
      Permission,
      UserRoleScope,
      WalletBinding,
      Employee,         // needed to look up email & employeeId
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
    JwtModule,         // so other modules can sign tokens if needed
  ],
})
export class AuthModule {}
