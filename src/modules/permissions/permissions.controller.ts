import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new permission' })
  create(@Body() data: any) {
    return this.permissionsService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('role/:roleId')
  @ApiOperation({ summary: 'Get permissions by role' })
  findByRole(@Param('roleId') roleId: string) {
    return this.permissionsService.findByRole(roleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a permission' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.permissionsService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a permission' })
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
