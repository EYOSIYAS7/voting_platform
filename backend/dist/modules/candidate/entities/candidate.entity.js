var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique, } from 'typeorm';
import { Election } from '../../election/entities/election.entity.js';
import { Employee } from '../../employee/employee.entity.js';
export var CandidateStatus;
(function (CandidateStatus) {
    CandidateStatus["PENDING"] = "PENDING";
    CandidateStatus["APPROVED"] = "APPROVED";
    CandidateStatus["REJECTED"] = "REJECTED";
    CandidateStatus["WITHDRAWN"] = "WITHDRAWN";
})(CandidateStatus || (CandidateStatus = {}));
let Candidate = class Candidate {
    id;
    electionId;
    election;
    employeeId;
    employee;
    statement;
    slogan;
    photoUrl;
    status;
    rejectionReason;
    onChainCandidateIndex;
    nominatedByEmployeeId;
    reviewedByEmployeeId;
    reviewedAt;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Candidate.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar' }),
    __metadata("design:type", String)
], Candidate.prototype, "electionId", void 0);
__decorate([
    ManyToOne(() => Election, { onDelete: 'CASCADE', eager: false }),
    JoinColumn({ name: 'electionId' }),
    __metadata("design:type", Election)
], Candidate.prototype, "election", void 0);
__decorate([
    Column({ type: 'varchar' }),
    __metadata("design:type", String)
], Candidate.prototype, "employeeId", void 0);
__decorate([
    ManyToOne(() => Employee, { onDelete: 'CASCADE', eager: false }),
    JoinColumn({ name: 'employeeId' }),
    __metadata("design:type", Employee)
], Candidate.prototype, "employee", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Candidate.prototype, "statement", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Candidate.prototype, "slogan", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Candidate.prototype, "photoUrl", void 0);
__decorate([
    Column({ type: 'enum', enum: CandidateStatus, default: CandidateStatus.PENDING }),
    __metadata("design:type", String)
], Candidate.prototype, "status", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Candidate.prototype, "rejectionReason", void 0);
__decorate([
    Column({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Candidate.prototype, "onChainCandidateIndex", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Candidate.prototype, "nominatedByEmployeeId", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Candidate.prototype, "reviewedByEmployeeId", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Candidate.prototype, "reviewedAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Candidate.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Candidate.prototype, "updatedAt", void 0);
Candidate = __decorate([
    Entity('candidates'),
    Unique(['electionId', 'employeeId']),
    Index(['electionId']),
    Index(['employeeId'])
], Candidate);
export { Candidate };
//# sourceMappingURL=candidate.entity.js.map