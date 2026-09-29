import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PositionService } from './position.service.js';
import { CreatePositionDto, UpdatePositionDto } from './dto/position.dto.js';

@ApiTags('positions')
@Controller('positions')
export class PositionController {
  constructor(private readonly service: PositionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organizational position' })
  create(@Body() dto: CreatePositionDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all positions' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single position' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a position' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a position' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
