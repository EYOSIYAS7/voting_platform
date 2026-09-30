var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index, Unique, } from 'typeorm';
import { Election } from './election.entity.js';
import { Employee } from '../../employee/employee.entity.js';
let ElectionVoter = class ElectionVoter {
    id;
    electionId;
    election;
    employeeId;
    employee;
    isEligible;
    txHash;
    hasVoted;
    votedAt;
    checkedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], ElectionVoter.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar' }),
    __metadata("design:type", String)
], ElectionVoter.prototype, "electionId", void 0);
__decorate([
    ManyToOne(() => Election, { onDelete: 'CASCADE', eager: false }),
    JoinColumn({ name: 'electionId' }),
    __metadata("design:type", Election)
], ElectionVoter.prototype, "election", void 0);
__decorate([
    Column({ type: 'varchar' }),
    __metadata("design:type", String)
], ElectionVoter.prototype, "employeeId", void 0);
__decorate([
    ManyToOne(() => Employee, { onDelete: 'CASCADE', eager: false }),
    JoinColumn({ name: 'employeeId' }),
    __metadata("design:type", Employee)
], ElectionVoter.prototype, "employee", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], ElectionVoter.prototype, "isEligible", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ElectionVoter.prototype, "txHash", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], ElectionVoter.prototype, "hasVoted", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], ElectionVoter.prototype, "votedAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], ElectionVoter.prototype, "checkedAt", void 0);
ElectionVoter = __decorate([
    Entity('election_voters'),
    Unique(['electionId', 'employeeId']),
    Index(['electionId']),
    Index(['employeeId'])
], ElectionVoter);
export { ElectionVoter };
//# sourceMappingURL=election-voter.entity.js.map