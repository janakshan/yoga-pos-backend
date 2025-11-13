import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RecipesService } from '../services/recipes.service';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  FilterRecipeDto,
  ScaleRecipeDto,
  ScaleRecipeByYieldDto,
  CalculateCostDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Recipes')
@Controller('recipes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @Roles('admin', 'manager', 'chef')
  @ApiOperation({ summary: 'Create a new recipe' })
  @ApiResponse({ status: 201, description: 'Recipe created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Recipe code already exists' })
  create(@Body() createRecipeDto: CreateRecipeDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.recipesService.create(createRecipeDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all recipes with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Recipes retrieved successfully' })
  findAll(@Query() filterDto: FilterRecipeDto) {
    return this.recipesService.findAll(filterDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get recipe statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics() {
    return this.recipesService.getStatistics();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get recipe by code' })
  @ApiParam({ name: 'code', description: 'Recipe code' })
  @ApiResponse({ status: 200, description: 'Recipe found' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  findByCode(@Param('code') code: string) {
    return this.recipesService.findByCode(code);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all recipes for a specific product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Recipes retrieved successfully' })
  getRecipesByProduct(@Param('productId') productId: string) {
    return this.recipesService.getRecipesByProduct(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recipe by ID' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiResponse({ status: 200, description: 'Recipe found' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  @Get(':id/cost-breakdown')
  @ApiOperation({ summary: 'Get detailed cost breakdown for a recipe' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiResponse({ status: 200, description: 'Cost breakdown retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  getCostBreakdown(@Param('id') id: string) {
    return this.recipesService.getCostBreakdown(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check ingredient availability for a recipe' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiQuery({ name: 'locationId', required: false, description: 'Branch location ID' })
  @ApiResponse({ status: 200, description: 'Availability check completed' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  checkAvailability(@Param('id') id: string, @Query('locationId') locationId?: string) {
    return this.recipesService.checkIngredientAvailability(id, locationId);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'chef')
  @ApiOperation({ summary: 'Update a recipe' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiResponse({ status: 200, description: 'Recipe updated successfully' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  update(@Param('id') id: string, @Body() updateRecipeDto: UpdateRecipeDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.recipesService.update(id, updateRecipeDto, userId);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a recipe' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiResponse({ status: 204, description: 'Recipe deleted successfully' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  remove(@Param('id') id: string) {
    return this.recipesService.remove(id);
  }

  @Post(':id/recalculate-costs')
  @Roles('admin', 'manager', 'chef')
  @ApiOperation({ summary: 'Recalculate costs for a specific recipe' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiResponse({ status: 200, description: 'Costs recalculated successfully' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  recalculateCosts(@Param('id') id: string) {
    return this.recipesService.recalculateCosts(id);
  }

  @Post('recalculate-costs/bulk')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Recalculate costs for multiple recipes' })
  @ApiResponse({ status: 200, description: 'Costs recalculated successfully' })
  recalculateAllCosts(@Body() calculateCostDto: CalculateCostDto) {
    return this.recipesService.recalculateAllCosts(calculateCostDto.recipeIds);
  }

  @Post(':id/scale')
  @ApiOperation({ summary: 'Scale a recipe by a factor' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiResponse({ status: 200, description: 'Recipe scaled successfully' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  scaleRecipe(@Param('id') id: string, @Body() scaleDto: ScaleRecipeDto) {
    return this.recipesService.scaleRecipe(id, scaleDto);
  }

  @Post(':id/scale-by-yield')
  @ApiOperation({ summary: 'Scale a recipe to achieve a desired yield' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiResponse({ status: 200, description: 'Recipe scaled successfully' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  scaleRecipeByYield(@Param('id') id: string, @Body() scaleByYieldDto: ScaleRecipeByYieldDto) {
    return this.recipesService.scaleRecipeByYield(id, scaleByYieldDto);
  }
}
