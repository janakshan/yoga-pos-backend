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
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CategoriesService } from './categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { BulkStatusUpdateDto } from './dto/bulk-status-update.dto';
import { InventoryAdjustmentDto } from './dto/inventory-adjustment.dto';
import { CalculateBundleDto } from './dto/calculate-bundle.dto';
import { SearchAttributesDto } from './dto/search-attributes.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { CustomFieldsDto } from './dto/custom-fields.dto';
import { GenerateBarcodeDto } from './dto/generate-barcode.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - SKU already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and search' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findAll(@Query() filterDto: FilterProductDto) {
    return this.productsService.findAll(filterDto);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiQuery({ name: 'threshold', required: false, type: Number, description: 'Stock threshold' })
  @ApiResponse({ status: 200, description: 'Low stock products retrieved successfully' })
  getLowStockProducts(@Query('threshold') threshold?: number) {
    return this.productsService.getLowStockProducts(threshold);
  }

  @Get('stock-value')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get total stock value and cost' })
  @ApiResponse({ status: 200, description: 'Stock value calculated successfully' })
  getStockValue() {
    return this.productsService.getStockValue();
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Get a product by SKU' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findBySku(@Param('sku') sku: string) {
    return this.productsService.findBySku(sku);
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Get a product by barcode' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/stock/set')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Set product stock quantity' })
  @ApiResponse({ status: 200, description: 'Stock updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.productsService.updateStock(id, quantity);
  }

  @Patch(':id/stock/adjust')
  @Roles('admin', 'manager', 'cashier')
  @ApiOperation({ summary: 'Adjust product stock (add or subtract)' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or insufficient stock' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  adjustStock(
    @Param('id') id: string,
    @Body('adjustment') adjustment: number,
  ) {
    return this.productsService.adjustStock(id, adjustment);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // New endpoints

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiResponse({ status: 200, description: 'Product statistics retrieved successfully' })
  getProductStats() {
    return this.productsService.getProductStats();
  }

  @Get('stock/out')
  @ApiOperation({ summary: 'Get out of stock products' })
  @ApiResponse({ status: 200, description: 'Out of stock products retrieved successfully' })
  getOutOfStockProducts() {
    return this.productsService.getOutOfStockProducts();
  }

  @Post('bulk/status')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Bulk update product status' })
  @ApiResponse({ status: 200, description: 'Products status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  bulkUpdateStatus(@Body() bulkStatusUpdateDto: BulkStatusUpdateDto) {
    return this.productsService.bulkUpdateStatus(bulkStatusUpdateDto);
  }

  @Post(':id/inventory/adjust')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Adjust inventory with detailed tracking' })
  @ApiResponse({ status: 200, description: 'Inventory adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or insufficient stock' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  inventoryAdjustment(
    @Param('id') id: string,
    @Body() inventoryAdjustmentDto: InventoryAdjustmentDto,
  ) {
    return this.productsService.inventoryAdjustment(id, inventoryAdjustmentDto);
  }

  @Get('bundles')
  @ApiOperation({ summary: 'Get all product bundles' })
  @ApiResponse({ status: 200, description: 'Bundles retrieved successfully' })
  getBundles() {
    return this.productsService.getBundles();
  }

  @Post('bundles/calculate')
  @ApiOperation({ summary: 'Calculate bundle price with discount' })
  @ApiResponse({ status: 200, description: 'Bundle price calculated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  calculateBundlePrice(@Body() calculateBundleDto: CalculateBundleDto) {
    return this.productsService.calculateBundlePrice(calculateBundleDto);
  }

  @Post('search/attributes')
  @ApiOperation({ summary: 'Search products by attributes' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  searchByAttributes(@Body() searchAttributesDto: SearchAttributesDto) {
    return this.productsService.searchByAttributes(searchAttributesDto);
  }

  @Get('attributes')
  @ApiOperation({ summary: 'Get all available product attributes' })
  @ApiResponse({ status: 200, description: 'Attributes retrieved successfully' })
  getAvailableAttributes() {
    return this.productsService.getAvailableAttributes();
  }

  @Post(':id/fields')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Add or update custom fields for a product' })
  @ApiResponse({ status: 200, description: 'Custom fields updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  addCustomFields(
    @Param('id') id: string,
    @Body() customFieldsDto: CustomFieldsDto,
  ) {
    return this.productsService.addCustomFields(id, customFieldsDto);
  }

  @Post('barcode/generate')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate barcode for a product' })
  @ApiResponse({ status: 200, description: 'Barcode generated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  generateBarcode(@Body() generateBarcodeDto: GenerateBarcodeDto) {
    return this.productsService.generateBarcode(generateBarcodeDto);
  }

  @Get('pricing/:tier')
  @ApiOperation({ summary: 'Get products by pricing tier' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  getProductsByPricingTier(@Param('tier') tier: string) {
    return this.productsService.getProductsByPricingTier(tier);
  }

  @Put(':id/pricing')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update product pricing tiers' })
  @ApiResponse({ status: 200, description: 'Pricing updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  updatePricing(
    @Param('id') id: string,
    @Body() updatePricingDto: UpdatePricingDto,
  ) {
    return this.productsService.updatePricing(id, updatePricingDto);
  }

  @Get('subcategory/:subcategoryId')
  @ApiOperation({ summary: 'Get products by subcategory' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  getProductsBySubcategory(@Param('subcategoryId') subcategoryId: string) {
    return this.productsService.getProductsBySubcategory(subcategoryId);
  }

  @Get('categories/:category/subcategories')
  @ApiOperation({ summary: 'Get subcategories of a category' })
  @ApiResponse({ status: 200, description: 'Subcategories retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  getCategorySubcategories(@Param('category') category: string) {
    return this.categoriesService.findSubcategories(category);
  }
}
