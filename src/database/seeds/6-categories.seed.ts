import { DataSource } from 'typeorm';
import { Category } from '../../modules/products/entities/category.entity';

export async function seedCategories(dataSource: DataSource): Promise<void> {
  const categoryRepository = dataSource.getRepository(Category);

  // Main categories
  const mainCategories = [
    {
      code: 'CAT001',
      name: 'Yoga Mats',
      description: 'High-quality yoga mats for all levels',
      displayOrder: 1,
      isActive: true,
      imageUrl: '/images/categories/yoga-mats.jpg',
    },
    {
      code: 'CAT002',
      name: 'Yoga Apparel',
      description: 'Comfortable and stylish yoga clothing',
      displayOrder: 2,
      isActive: true,
      imageUrl: '/images/categories/apparel.jpg',
    },
    {
      code: 'CAT003',
      name: 'Accessories',
      description: 'Essential yoga accessories and props',
      displayOrder: 3,
      isActive: true,
      imageUrl: '/images/categories/accessories.jpg',
    },
    {
      code: 'CAT004',
      name: 'Meditation',
      description: 'Products for meditation and mindfulness',
      displayOrder: 4,
      isActive: true,
      imageUrl: '/images/categories/meditation.jpg',
    },
    {
      code: 'CAT005',
      name: 'Wellness',
      description: 'Health and wellness products',
      displayOrder: 5,
      isActive: true,
      imageUrl: '/images/categories/wellness.jpg',
    },
  ];

  const createdMainCategories: { [key: string]: Category } = {};

  for (const categoryData of mainCategories) {
    let category = await categoryRepository.findOne({
      where: { code: categoryData.code },
    });

    if (!category) {
      category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);
      console.log(`✓ Created category: ${categoryData.name}`);
    } else {
      console.log(`- Category already exists: ${categoryData.name}`);
    }

    createdMainCategories[categoryData.code] = category;
  }

  // Subcategories
  const subCategories = [
    {
      code: 'CAT001-01',
      name: 'Premium Mats',
      description: 'High-end yoga mats with superior grip',
      parentCode: 'CAT001',
      displayOrder: 1,
      isActive: true,
    },
    {
      code: 'CAT001-02',
      name: 'Travel Mats',
      description: 'Lightweight and portable yoga mats',
      parentCode: 'CAT001',
      displayOrder: 2,
      isActive: true,
    },
    {
      code: 'CAT001-03',
      name: 'Eco-Friendly Mats',
      description: 'Sustainable and biodegradable yoga mats',
      parentCode: 'CAT001',
      displayOrder: 3,
      isActive: true,
    },
    {
      code: 'CAT002-01',
      name: 'Women\'s Apparel',
      description: 'Yoga clothing for women',
      parentCode: 'CAT002',
      displayOrder: 1,
      isActive: true,
    },
    {
      code: 'CAT002-02',
      name: 'Men\'s Apparel',
      description: 'Yoga clothing for men',
      parentCode: 'CAT002',
      displayOrder: 2,
      isActive: true,
    },
    {
      code: 'CAT003-01',
      name: 'Blocks & Straps',
      description: 'Yoga blocks and straps for proper alignment',
      parentCode: 'CAT003',
      displayOrder: 1,
      isActive: true,
    },
    {
      code: 'CAT003-02',
      name: 'Bolsters & Blankets',
      description: 'Support props for restorative yoga',
      parentCode: 'CAT003',
      displayOrder: 2,
      isActive: true,
    },
    {
      code: 'CAT004-01',
      name: 'Meditation Cushions',
      description: 'Comfortable cushions for meditation practice',
      parentCode: 'CAT004',
      displayOrder: 1,
      isActive: true,
    },
    {
      code: 'CAT004-02',
      name: 'Incense & Candles',
      description: 'Aromatherapy for meditation',
      parentCode: 'CAT004',
      displayOrder: 2,
      isActive: true,
    },
    {
      code: 'CAT005-01',
      name: 'Supplements',
      description: 'Nutritional supplements for wellness',
      parentCode: 'CAT005',
      displayOrder: 1,
      isActive: true,
    },
  ];

  for (const subCategoryData of subCategories) {
    const { parentCode, ...categoryData } = subCategoryData;
    const parent = createdMainCategories[parentCode];

    const existingCategory = await categoryRepository.findOne({
      where: { code: categoryData.code },
    });

    if (!existingCategory) {
      const category = categoryRepository.create({
        ...categoryData,
        parent,
      });
      await categoryRepository.save(category);
      console.log(`✓ Created subcategory: ${categoryData.name}`);
    } else {
      console.log(`- Subcategory already exists: ${categoryData.name}`);
    }
  }
}
