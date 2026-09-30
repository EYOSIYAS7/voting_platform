import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  ParseUUIDPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeService } from './employee.service.js';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto.js';
import { EmployeeStatus } from './employee.entity.js';

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new employee' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List employees with optional filters' })
  @ApiQuery({ name: 'unitId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: EmployeeStatus })
  @ApiQuery({ name: 'positionId', required: false, type: String })
  findAll(
    @Query('unitId') unitId?: string,
    @Query('status') status?: EmployeeStatus,
    @Query('positionId') positionId?: string,
  ) {
    return this.service.findAll({ unitId, status, positionId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single employee' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee details or status' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an employee record' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
