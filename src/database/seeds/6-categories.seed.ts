import { DataSource } from 'typeorm';
import { Category } from '../../modules/products/entities/category.entity';

export async function seedCategories(dataSource: DataSource): Promise<void> {
  const categoryRepository = dataSource.getRepository(Category);

  // Main categories
  const mainCategories = [
    {
      name: 'Yoga Mats',
      code: 'YOGA_MATS',
      description: 'High-quality yoga mats for all levels',
      displayOrder: 1,
      imageUrl: '/images/categories/yoga-mats.jpg',
    },
    {
      name: 'Yoga Apparel',
      code: 'YOGA_APPAREL',
      description: 'Comfortable and stylish yoga clothing',
      displayOrder: 2,
      imageUrl: '/images/categories/apparel.jpg',
    },
    {
      name: 'Accessories',
      code: 'ACCESSORIES',
      description: 'Essential yoga accessories and props',
      displayOrder: 3,
      imageUrl: '/images/categories/accessories.jpg',
    },
    {
      name: 'Meditation',
      code: 'MEDITATION',
      description: 'Products for meditation and mindfulness',
      displayOrder: 4,
      imageUrl: '/images/categories/meditation.jpg',
    },
    {
      name: 'Wellness',
      code: 'WELLNESS',
      description: 'Health and wellness products',
      displayOrder: 5,
      imageUrl: '/images/categories/wellness.jpg',
    },
  ];

  const createdMainCategories: { [key: string]: Category } = {};

  for (const categoryData of mainCategories) {
    let category = await categoryRepository.findOne({
      where: { name: categoryData.name },
    });

    if (!category) {
      category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);
      console.log(`✓ Created category: ${categoryData.name}`);
    } else {
      console.log(`- Category already exists: ${categoryData.name}`);
    }

    createdMainCategories[categoryData.name] = category;
  }

  // Subcategories
  const subCategories = [
    {
      name: 'Premium Mats',
      code: 'PREMIUM_MATS',
      description: 'High-end yoga mats with superior grip',
      parentName: 'Yoga Mats',
      displayOrder: 1,
    },
    {
      name: 'Travel Mats',
      code: 'TRAVEL_MATS',
      description: 'Lightweight and portable yoga mats',
      parentName: 'Yoga Mats',
      displayOrder: 2,
    },
    {
      name: 'Eco-Friendly Mats',
      code: 'ECO_FRIENDLY_MATS',
      description: 'Sustainable and biodegradable yoga mats',
      parentName: 'Yoga Mats',
      displayOrder: 3,
    },
    {
      name: 'Women\'s Apparel',
      code: 'WOMENS_APPAREL',
      description: 'Yoga clothing for women',
      parentName: 'Yoga Apparel',
      displayOrder: 1,
    },
    {
      name: 'Men\'s Apparel',
      code: 'MENS_APPAREL',
      description: 'Yoga clothing for men',
      parentName: 'Yoga Apparel',
      displayOrder: 2,
    },
    {
      name: 'Blocks & Straps',
      code: 'BLOCKS_STRAPS',
      description: 'Yoga blocks and straps for proper alignment',
      parentName: 'Accessories',
      displayOrder: 1,
    },
    {
      name: 'Bolsters & Blankets',
      code: 'BOLSTERS_BLANKETS',
      description: 'Support props for restorative yoga',
      parentName: 'Accessories',
      displayOrder: 2,
    },
    {
      name: 'Meditation Cushions',
      code: 'MEDITATION_CUSHIONS',
      description: 'Comfortable cushions for meditation practice',
      parentName: 'Meditation',
      displayOrder: 1,
    },
    {
      name: 'Incense & Candles',
      code: 'INCENSE_CANDLES',
      description: 'Aromatherapy for meditation',
      parentName: 'Meditation',
      displayOrder: 2,
    },
    {
      name: 'Supplements',
      code: 'SUPPLEMENTS',
      description: 'Nutritional supplements for wellness',
      parentName: 'Wellness',
      displayOrder: 1,
    },
  ];

  for (const subCategoryData of subCategories) {
    const { parentName, ...categoryData } = subCategoryData;
    const parent = createdMainCategories[parentName];

    const existingCategory = await categoryRepository.findOne({
      where: { name: categoryData.name },
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
