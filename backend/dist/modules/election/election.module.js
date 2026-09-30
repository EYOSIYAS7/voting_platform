var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Election } from './entities/election.entity.js';
import { EligibilityRule } from './entities/eligibility-rule.entity.js';
import { ElectionVoter } from './entities/election-voter.entity.js';
import { Employee } from '../employee/employee.entity.js';
import { ElectionService } from './election.service.js';
import { ElectionController } from './election.controller.js';
import { OrganizationalUnitModule } from '../organizational-unit/organizational-unit.module.js';
import { AuthModule } from '../auth/auth.module.js';
let ElectionModule = class ElectionModule {
};
ElectionModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forFeature([Election, EligibilityRule, ElectionVoter, Employee]),
            OrganizationalUnitModule,
            AuthModule,
        ],
        providers: [ElectionService],
        controllers: [ElectionController],
        exports: [ElectionService],
    })
], ElectionModule);
export { ElectionModule };
//# sourceMappingURL=election.module.js.map