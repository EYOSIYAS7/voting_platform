var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, } from 'typeorm';
import { Election } from './election.entity.js';
let EligibilityRule = class EligibilityRule {
    id;
    electionId;
    election;
    unitId;
    includeDescendants;
    allowedPositionIds;
    minTenureMonths;
    requiredStatus;
    description;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], EligibilityRule.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar' }),
    __metadata("design:type", String)
], EligibilityRule.prototype, "electionId", void 0);
__decorate([
    ManyToOne(() => Election, { onDelete: 'CASCADE', eager: false }),
    JoinColumn({ name: 'electionId' }),
    __metadata("design:type", Election)
], EligibilityRule.prototype, "election", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], EligibilityRule.prototype, "unitId", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], EligibilityRule.prototype, "includeDescendants", void 0);
__decorate([
    Column({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], EligibilityRule.prototype, "allowedPositionIds", void 0);
__decorate([
    Column({ default: 0 }),
    __metadata("design:type", Number)
], EligibilityRule.prototype, "minTenureMonths", void 0);
__decorate([
    Column({ type: 'varchar', default: 'ACTIVE' }),
    __metadata("design:type", String)
], EligibilityRule.prototype, "requiredStatus", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EligibilityRule.prototype, "description", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], EligibilityRule.prototype, "createdAt", void 0);
EligibilityRule = __decorate([
    Entity('eligibility_rules')
], EligibilityRule);
export { EligibilityRule };
//# sourceMappingURL=eligibility-rule.entity.js.map