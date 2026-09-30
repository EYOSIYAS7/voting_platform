var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, } from 'typeorm';
import { Organization } from '../../organization/organization.entity.js';
export var ElectionType;
(function (ElectionType) {
    ElectionType["GENERAL"] = "GENERAL";
    ElectionType["UNIT_SCOPED"] = "UNIT_SCOPED";
    ElectionType["POSITION_SCOPED"] = "POSITION_SCOPED";
})(ElectionType || (ElectionType = {}));
export var ElectionStatus;
(function (ElectionStatus) {
    ElectionStatus["DRAFT"] = "DRAFT";
    ElectionStatus["REGISTRATION"] = "REGISTRATION";
    ElectionStatus["UPCOMING"] = "UPCOMING";
    ElectionStatus["ACTIVE"] = "ACTIVE";
    ElectionStatus["ENDED"] = "ENDED";
    ElectionStatus["CANCELLED"] = "CANCELLED";
})(ElectionStatus || (ElectionStatus = {}));
let Election = class Election {
    id;
    organizationId;
    organization;
    title;
    description;
    electionType;
    status;
    unitScopeId;
    registrationDeadline;
    startDate;
    endDate;
    onChainElectionId;
    maxCandidates;
    votersComputed;
    createdByEmployeeId;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Election.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Election.prototype, "organizationId", void 0);
__decorate([
    ManyToOne(() => Organization, { onDelete: 'CASCADE', eager: false }),
    JoinColumn({ name: 'organizationId' }),
    __metadata("design:type", Organization)
], Election.prototype, "organization", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Election.prototype, "title", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Election.prototype, "description", void 0);
__decorate([
    Column({ type: 'enum', enum: ElectionType, default: ElectionType.GENERAL }),
    __metadata("design:type", String)
], Election.prototype, "electionType", void 0);
__decorate([
    Column({ type: 'enum', enum: ElectionStatus, default: ElectionStatus.DRAFT }),
    __metadata("design:type", String)
], Election.prototype, "status", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Election.prototype, "unitScopeId", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Election.prototype, "registrationDeadline", void 0);
__decorate([
    Column({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Election.prototype, "startDate", void 0);
__decorate([
    Column({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Election.prototype, "endDate", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Election.prototype, "onChainElectionId", void 0);
__decorate([
    Column({ default: 0 }),
    __metadata("design:type", Number)
], Election.prototype, "maxCandidates", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], Election.prototype, "votersComputed", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Election.prototype, "createdByEmployeeId", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Election.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Election.prototype, "updatedAt", void 0);
Election = __decorate([
    Entity('elections')
], Election);
export { Election };
//# sourceMappingURL=election.entity.js.map