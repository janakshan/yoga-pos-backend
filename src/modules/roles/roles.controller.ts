import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new role' })
  create(@Body() data: any) {
    return this.rolesService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a role' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.rolesService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a role' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
