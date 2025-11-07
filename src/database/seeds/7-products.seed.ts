import { DataSource } from 'typeorm';
import { Product } from '../../modules/products/entities/product.entity';
import { Category } from '../../modules/products/entities/category.entity';
import { Supplier } from '../../modules/suppliers/entities/supplier.entity';

export async function seedProducts(dataSource: DataSource): Promise<void> {
  const productRepository = dataSource.getRepository(Product);
  const categoryRepository = dataSource.getRepository(Category);
  const supplierRepository = dataSource.getRepository(Supplier);

  // Get main categories
  const yogaMatsCategory = await categoryRepository.findOne({ where: { name: 'Yoga Mats' } });
  const yogaApparelCategory = await categoryRepository.findOne({ where: { name: 'Yoga Apparel' } });
  const accessoriesCategory = await categoryRepository.findOne({ where: { name: 'Accessories' } });
  const meditationCategory = await categoryRepository.findOne({ where: { name: 'Meditation' } });
  const wellnessCategory = await categoryRepository.findOne({ where: { name: 'Wellness' } });

  // Get subcategories
  const premiumMatsCategory = await categoryRepository.findOne({ where: { name: 'Premium Mats' } });
  const travelMatsCategory = await categoryRepository.findOne({ where: { name: 'Travel Mats' } });
  const ecoMatsCategory = await categoryRepository.findOne({ where: { name: 'Eco-Friendly Mats' } });
  const womensApparelCategory = await categoryRepository.findOne({ where: { name: 'Women\'s Apparel' } });
  const mensApparelCategory = await categoryRepository.findOne({ where: { name: 'Men\'s Apparel' } });
  const blocksStrapsCategory = await categoryRepository.findOne({ where: { name: 'Blocks & Straps' } });
  const bolstersCategory = await categoryRepository.findOne({ where: { name: 'Bolsters & Blankets' } });
  const cushionsCategory = await categoryRepository.findOne({ where: { name: 'Meditation Cushions' } });
  const incenseCategory = await categoryRepository.findOne({ where: { name: 'Incense & Candles' } });
  const supplementsCategory = await categoryRepository.findOne({ where: { name: 'Supplements' } });

  // Get suppliers
  const yogaEssentials = await supplierRepository.findOne({ where: { code: 'SUP001' } });
  const mindfulApparel = await supplierRepository.findOne({ where: { code: 'SUP002' } });
  const zenEquipment = await supplierRepository.findOne({ where: { code: 'SUP003' } });
  const holisticHealth = await supplierRepository.findOne({ where: { code: 'SUP004' } });

  const products = [
    // Premium Yoga Mats
    {
      sku: 'YM-PRE-001',
      name: 'Professional Yoga Mat - Black',
      description: 'Premium 6mm yoga mat with excellent grip and cushioning. Perfect for all yoga styles.',
      category: premiumMatsCategory,
      subcategory: premiumMatsCategory,
      supplier: yogaEssentials,
      barcode: '1234567890123',
      price: 89.99,
      cost: 45.00,
      taxRate: 8.5,
      unit: 'piece',
      reorderLevel: 10,
      reorderQuantity: 20,
      isActive: true,
      isFeatured: true,
      trackInventory: true,
      allowBackorder: false,
      imageUrl: '/images/products/yoga-mat-black.jpg',
      images: ['/images/products/yoga-mat-black-1.jpg', '/images/products/yoga-mat-black-2.jpg'],
      attributes: {
        color: 'Black',
        thickness: '6mm',
        material: 'TPE',
        length: '183cm',
        width: '61cm',
      },
      dimensions: {
        length: 183,
        width: 61,
        height: 0.6,
        weight: 1.2,
        unit: 'cm/kg',
      },
      seo: {
        title: 'Professional Black Yoga Mat - Premium Quality',
        description: 'High-quality 6mm yoga mat for professionals',
        keywords: ['yoga mat', 'premium', 'black', 'professional'],
      },
    },
    {
      sku: 'YM-PRE-002',
      name: 'Professional Yoga Mat - Purple',
      description: 'Premium 6mm yoga mat in vibrant purple color with superior grip.',
      category: premiumMatsCategory,
      subcategory: premiumMatsCategory,
      supplier: yogaEssentials,
      barcode: '1234567890124',
      price: 89.99,
      cost: 45.00,
      taxRate: 8.5,
      unit: 'piece',
      reorderLevel: 10,
      reorderQuantity: 20,
      isActive: true,
      isFeatured: true,
      trackInventory: true,
      allowBackorder: false,
      imageUrl: '/images/products/yoga-mat-purple.jpg',
      attributes: {
        color: 'Purple',
        thickness: '6mm',
        material: 'TPE',
        length: '183cm',
        width: '61cm',
      },
      dimensions: {
        length: 183,
        width: 61,
        height: 0.6,
        weight: 1.2,
        unit: 'cm/kg',
      },
    },
    // Travel Mats
    {
      sku: 'YM-TRV-001',
      name: 'Travel Yoga Mat - Foldable',
      description: 'Ultra-lightweight foldable yoga mat perfect for travelers. Only 1.5mm thick.',
      category: travelMatsCategory,
      subcategory: travelMatsCategory,
      supplier: yogaEssentials,
      barcode: '1234567890125',
      price: 49.99,
      cost: 25.00,
      taxRate: 8.5,
      unit: 'piece',
      reorderLevel: 15,
      reorderQuantity: 30,
      isActive: true,
      isFeatured: false,
      trackInventory: true,
      allowBackorder: true,
      imageUrl: '/images/products/travel-mat.jpg',
      attributes: {
        color: 'Blue',
        thickness: '1.5mm',
        material: 'Natural Rubber',
        length: '180cm',
        width: '60cm',
        foldable: true,
      },
      dimensions: {
        length: 180,
        width: 60,
        height: 0.15,
        weight: 0.5,
        unit: 'cm/kg',
      },
    },
    // Eco-Friendly Mats
    {
      sku: 'YM-ECO-001',
      name: 'Eco Cork Yoga Mat',
      description: 'Sustainable yoga mat made from natural cork and recycled rubber.',
      category: ecoMatsCategory,
      subcategory: ecoMatsCategory,
      supplier: yogaEssentials,
      barcode: '1234567890126',
      price: 99.99,
      cost: 55.00,
      taxRate: 8.5,
      unit: 'piece',
      reorderLevel: 8,
      reorderQuantity: 15,
      isActive: true,
      isFeatured: true,
      trackInventory: true,
      allowBackorder: false,
      imageUrl: '/images/products/cork-mat.jpg',
      attributes: {
        color: 'Natural Cork',
        thickness: '5mm',
        material: 'Cork & Recycled Rubber',
        length: '183cm',
        width: '61cm',
        sustainable: true,
      },
      dimensions: {
        length: 183,
        width: 61,
        height: 0.5,
        weight: 1.5,
        unit: 'cm/kg',
      },
    },
    // Women's Apparel
    {
      sku: 'AP-WOM-001',
      name: 'High-Waist Yoga Leggings - Black',
      description: 'Comfortable high-waist leggings with moisture-wicking fabric.',
      category: womensApparelCategory,
      subcategory: womensApparelCategory,
      supplier: mindfulApparel,
      barcode: '2234567890123',
      price: 59.99,
      cost: 30.00,
      taxRate: 8.5,
      unit: 'piece',
      reorderLevel: 20,
      reorderQuantity: 50,
      isActive: true,
      isFeatured: true,
      trackInventory: true,
      allowBackorder: true,
      imageUrl: '/images/products/leggings-black.jpg',
      attributes: {
        color: 'Black',
        size: 'M',
        material: 'Polyester/Spandex',
        style: 'High-Waist',
      },
    },
    {
      sku: 'AP-WOM-002',
      name: 'Sports Bra - Light Pink',
      description: 'Supportive sports bra with adjustable straps and removable padding.',
      category: womensApparelCategory,
      subcategory: womensApparelCategory,
      supplier: mindfulApparel,
      barcode: '2234567890124',
      price: 39.99,
      cost: 20.00,
      taxRate: 8.5,
      unit: 'piece',
      reorderLevel: 25,
      reorderQuantity: 60,
      isActive: true,
      isFeatured: false,
      trackInventory: true,
      allowBackorder: true,
      imageUrl: '/images/products/sports-bra-pink.jpg',
      attributes: {
        color: 'Light Pink',
        size: 'M',
        material: 'Nylon/Spandex',
        support: 'Medium',
      },
    },
    // Men's Apparel
    {
      sku: 'AP-MEN-001',
      name: 'Men\'s Yoga Shorts - Navy',
      description: 'Breathable yoga shorts with built-in compression layer.',
      category: mensApparelCategory,
      subcategory: mensApparelCategory,
      supplier: mindfulApparel,
      barcode: '2234567890125',
      price: 44.99,
      cost: 22.00,
      taxRate: 8.5,
      unit: 'piece',
      reorderLevel: 15,
      reorderQuantity: 40,
      isActive: true,
      isFeatured: false,
      trackInventory: true,
      allowBackorder: true,
      imageUrl: '/images/products/mens-shorts-navy.jpg',
      attributes: {
        color: 'Navy',
        size: 'L',
        material: 'Polyester',
        style: 'Athletic',
      },
    },
    // Blocks & Straps
    {
      sku: 'AC-BLK-001',
      name: 'Cork Yoga Block - Set of 2',
      description: 'Natural cork yoga blocks for support and alignment. Set of 2.',
      category: blocksStrapsCategory,
      subcategory: blocksStrapsCategory,
      supplier: zenEquipment,
      barcode: '3234567890123',
      price: 24.99,
      cost: 12.00,
      taxRate: 8.5,
      unit: 'set',
      reorderLevel: 20,
      reorderQuantity: 40,
      isActive: true,
      isFeatured: false,
      trackInventory: true,
      allowBackorder: false,
      imageUrl: '/images/products/cork-blocks.jpg',
      attributes: {
        material: 'Natural Cork',
        dimensions: '9" x 6" x 4"',
        quantity: 2,
      },
    },
    {
      sku: 'AC-STR-001',
      name: 'Yoga Strap - 8ft',
      description: 'Durable cotton yoga strap with D-ring buckle. 8 feet long.',
      category: blocksStrapsCategory,
      subcategory: blocksStrapsCategory,
      supplier: zenEquipment,
      barcode: '3234567890124',
      price: 14.99,
      cost: 7.00,
      taxRate: 8.5,
      unit: 'piece',
      reorderLevel: 30,
      reorderQuantity: 60,
      isActive: true,
      isFeatured: false,
      trackInventory: true,
      allowBackorder: true,
      imageUrl: '/images/products/yoga-strap.jpg',
      attributes: {
        color: 'Purple',
        length: '8ft',
        material: 'Cotton',
        width: '1.5"',
      },
    },
    // Bolsters
    {
      sku: 'AC-BOL-001',
      name: 'Rectangular Yoga Bolster',
      description: 'Firm rectangular bolster for restorative yoga and meditation.',
      category: bolstersCategory,
      subcategory: bolstersCategory,
      supplier: zenEquipment,
      barcode: '3234567890125',
      price: 69.99,
      cost: 35.00,
      taxRate: 8.5,
      unit: 'piece',
      reorderLevel: 10,
      reorderQuantity: 20,
      isActive: true,
      isFeatured: false,
      trackInventory: true,
      allowBackorder: false,
      imageUrl: '/images/products/bolster.jpg',
      attributes: {
        color: 'Teal',
        shape: 'Rectangular',
        material: 'Cotton Cover',
        filling: 'Cotton Batting',
        dimensions: '26" x 10" x 6"',
      },
    },
    // Meditation Cushions
    {
      sku: 'MD-CSH-001',
      name: 'Zafu Meditation Cushion',
      description: 'Traditional round meditation cushion filled with buckwheat hulls.',
      category: cushionsCategory,
      subcategory: cushionsCategory,
      supplier: zenEquipment,
      barcode: '4234567890123',
      price: 54.99,
      cost: 28.00,
      taxRate: 8.5,
      unit: 'piece',
      reorderLevel: 12,
      reorderQuantity: 25,
      isActive: true,
      isFeatured: true,
      trackInventory: true,
      allowBackorder: false,
      imageUrl: '/images/products/zafu-cushion.jpg',
      attributes: {
        color: 'Burgundy',
        shape: 'Round',
        diameter: '14"',
        height: '6"',
        filling: 'Buckwheat Hulls',
      },
    },
    // Incense
    {
      sku: 'MD-INC-001',
      name: 'Lavender Incense Sticks - Pack of 100',
      description: 'Natural lavender incense sticks for relaxation and meditation.',
      category: incenseCategory,
      subcategory: incenseCategory,
      supplier: holisticHealth,
      barcode: '5234567890123',
      price: 19.99,
      cost: 8.00,
      taxRate: 8.5,
      unit: 'pack',
      reorderLevel: 25,
      reorderQuantity: 50,
      isActive: true,
      isFeatured: false,
      trackInventory: true,
      allowBackorder: true,
      imageUrl: '/images/products/lavender-incense.jpg',
      attributes: {
        scent: 'Lavender',
        quantity: 100,
        burnTime: '45 minutes per stick',
        natural: true,
      },
    },
    // Supplements
    {
      sku: 'WL-SUP-001',
      name: 'Organic Turmeric Capsules',
      description: 'Organic turmeric supplement with black pepper for enhanced absorption. 60 capsules.',
      category: supplementsCategory,
      subcategory: supplementsCategory,
      supplier: holisticHealth,
      barcode: '6234567890123',
      price: 29.99,
      cost: 15.00,
      taxRate: 8.5,
      unit: 'bottle',
      reorderLevel: 30,
      reorderQuantity: 60,
      isActive: true,
      isFeatured: true,
      trackInventory: true,
      allowBackorder: true,
      imageUrl: '/images/products/turmeric.jpg',
      attributes: {
        form: 'Capsules',
        quantity: 60,
        servingSize: '2 capsules',
        organic: true,
        vegan: true,
      },
    },
  ];

  for (const productData of products) {
    const existingProduct = await productRepository.findOne({
      where: { sku: productData.sku },
    });

    if (!existingProduct) {
      // Transform the product data to match the entity
      const {
        supplier: supplierEntity,
        isActive,
        isFeatured,
        images,
        reorderLevel,
        reorderQuantity,
        dimensions,
        seo,
        category,
        subcategory,
        ...rest
      } = productData as any;

      const transformedData: any = {
        ...rest,
        status: isActive ? 'active' : 'inactive',
        imageUrls: images,
        lowStockThreshold: reorderLevel,
        supplierId: supplierEntity?.id,
        supplier: supplierEntity?.name,
      };

      // Only add category if it exists
      if (category) {
        transformedData.category = category;
      }

      // Only add subcategory if it exists
      if (subcategory) {
        transformedData.subcategory = subcategory;
      }

      // Add dimensions and seo to customFields
      if (dimensions || seo || isFeatured !== undefined) {
        transformedData.customFields = {
          ...(dimensions && { dimensions }),
          ...(seo && { seo }),
          ...(isFeatured !== undefined && { isFeatured }),
        };
      }

      const product = productRepository.create(transformedData);
      await productRepository.save(product);
      console.log(`✓ Created product: ${productData.name}`);
    } else {
      console.log(`- Product already exists: ${productData.name}`);
    }
  }
}
