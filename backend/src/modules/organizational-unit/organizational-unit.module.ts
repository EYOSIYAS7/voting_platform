import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationalUnit } from './organizational-unit.entity.js';
import { OrganizationalUnitService } from './organizational-unit.service.js';
import { OrganizationalUnitController } from './organizational-unit.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationalUnit])],
  controllers: [OrganizationalUnitController],
  providers: [OrganizationalUnitService],
  exports: [OrganizationalUnitService],
})
export class OrganizationalUnitModule {}
