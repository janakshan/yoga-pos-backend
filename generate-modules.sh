#!/bin/bash

# Script to generate remaining NestJS module skeletons
# This creates the basic structure for all modules

MODULES=(
  "roles"
  "permissions"
  "branches"
  "products"
  "customers"
  "inventory"
  "pos"
  "invoices"
  "payments"
  "expenses"
  "suppliers"
  "purchase-orders"
)

generate_module_files() {
  local module=$1
  local MODULE_UPPER=$(echo $module | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))} 1' | sed 's/ //g')
  local module_path="src/modules/$module"

  echo "Generating module: $module"

  # Create directories
  mkdir -p "$module_path/dto"
  mkdir -p "$module_path/entities"

  # Service file
  cat > "$module_path/$module.service.ts" << EOF
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${MODULE_UPPER} } from './entities/${module}.entity';
import { Create${MODULE_UPPER}Dto } from './dto/create-${module}.dto';
import { Update${MODULE_UPPER}Dto } from './dto/update-${module}.dto';

@Injectable()
export class ${MODULE_UPPER}Service {
  constructor(
    @InjectRepository(${MODULE_UPPER})
    private repository: Repository<${MODULE_UPPER}>,
  ) {}

  async create(createDto: Create${MODULE_UPPER}Dto) {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findAll() {
    return this.repository.find();
  }

  async findOne(id: string) {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(\`${MODULE_UPPER} with ID \${id} not found\`);
    }
    return entity;
  }

  async update(id: string, updateDto: Update${MODULE_UPPER}Dto) {
    await this.findOne(id);
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
  }
}
EOF

  # Controller file
  cat > "$module_path/$module.controller.ts" << EOF
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ${MODULE_UPPER}Service } from './${module}.service';
import { Create${MODULE_UPPER}Dto } from './dto/create-${module}.dto';
import { Update${MODULE_UPPER}Dto } from './dto/update-${module}.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('${MODULE_UPPER}')
@Controller('$module')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ${MODULE_UPPER}Controller {
  constructor(private readonly service: ${MODULE_UPPER}Service) {}

  @Post()
  @ApiOperation({ summary: 'Create ${module}' })
  create(@Body() createDto: Create${MODULE_UPPER}Dto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ${module}' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${module} by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ${module}' })
  update(@Param('id') id: string, @Body() updateDto: Update${MODULE_UPPER}Dto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ${module}' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
EOF

  # Module file
  cat > "$module_path/$module.module.ts" << EOF
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${MODULE_UPPER}Service } from './${module}.service';
import { ${MODULE_UPPER}Controller } from './${module}.controller';
import { ${MODULE_UPPER} } from './entities/${module}.entity';

@Module({
  imports: [TypeOrmModule.forFeature([${MODULE_UPPER}])],
  controllers: [${MODULE_UPPER}Controller],
  providers: [${MODULE_UPPER}Service],
  exports: [${MODULE_UPPER}Service],
})
export class ${MODULE_UPPER}Module {}
EOF

  echo "✓ Module $module generated successfully"
}

# Generate all modules
for module in "${MODULES[@]}"; do
  if [ ! -f "src/modules/$module/$module.module.ts" ]; then
    generate_module_files "$module"
  else
    echo "⊘ Module $module already exists, skipping..."
  fi
done

echo ""
echo "✅ All modules generated successfully!"
echo ""
echo "Note: You still need to create entities and DTOs for each module."
echo "Refer to the API documentation for entity structures."
