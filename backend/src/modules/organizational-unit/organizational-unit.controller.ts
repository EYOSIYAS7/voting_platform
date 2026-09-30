import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationalUnitService } from './organizational-unit.service.js';
import {
  CreateOrganizationalUnitDto,
  UpdateOrganizationalUnitDto,
} from './dto/organizational-unit.dto.js';

@ApiTags('organizational-units')
@ApiBearerAuth()
@Controller('organizational-units')
export class OrganizationalUnitController {
  constructor(private readonly service: OrganizationalUnitService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organizational unit' })
  create(@Body() dto: CreateOrganizationalUnitDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all units for an organization (flat list)' })
  @ApiQuery({ name: 'organizationId', required: true, type: String })
  findAll(@Query('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.service.findAll(organizationId);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get nested tree structure for an organization' })
  @ApiQuery({ name: 'organizationId', required: true, type: String })
  getTree(@Query('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.service.getTree(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single organizational unit' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/descendants')
  @ApiOperation({ summary: 'Get all descendant unit IDs (for scope calculation)' })
  getDescendants(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getDescendantIds(id);
  }

  @Get(':id/ancestors')
  @ApiOperation({ summary: 'Get ancestor chain / breadcrumb for a unit' })
  getAncestors(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAncestors(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an organizational unit' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationalUnitDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organizational unit (must have no children)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
