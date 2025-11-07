import { DataSource } from 'typeorm';
import { Category } from '../../modules/products/entities/category.entity';

export async function seedCategories(dataSource: DataSource): Promise<void> {
  const categoryRepository = dataSource.getRepository(Category);

  // Main categories
  const mainCategories = [
    {
      name: 'Yoga Mats',
      description: 'High-quality yoga mats for all levels',
      sortOrder: 1,
      imageUrl: '/images/categories/yoga-mats.jpg',
    },
    {
      name: 'Yoga Apparel',
      description: 'Comfortable and stylish yoga clothing',
      sortOrder: 2,
      imageUrl: '/images/categories/apparel.jpg',
    },
    {
      name: 'Accessories',
      description: 'Essential yoga accessories and props',
      sortOrder: 3,
      imageUrl: '/images/categories/accessories.jpg',
    },
    {
      name: 'Meditation',
      description: 'Products for meditation and mindfulness',
      sortOrder: 4,
      imageUrl: '/images/categories/meditation.jpg',
    },
    {
      name: 'Wellness',
      description: 'Health and wellness products',
      sortOrder: 5,
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
      description: 'High-end yoga mats with superior grip',
      parentName: 'Yoga Mats',
      sortOrder: 1,
    },
    {
      name: 'Travel Mats',
      description: 'Lightweight and portable yoga mats',
      parentName: 'Yoga Mats',
      sortOrder: 2,
    },
    {
      name: 'Eco-Friendly Mats',
      description: 'Sustainable and biodegradable yoga mats',
      parentName: 'Yoga Mats',
      sortOrder: 3,
    },
    {
      name: 'Women\'s Apparel',
      description: 'Yoga clothing for women',
      parentName: 'Yoga Apparel',
      sortOrder: 1,
    },
    {
      name: 'Men\'s Apparel',
      description: 'Yoga clothing for men',
      parentName: 'Yoga Apparel',
      sortOrder: 2,
    },
    {
      name: 'Blocks & Straps',
      description: 'Yoga blocks and straps for proper alignment',
      parentName: 'Accessories',
      sortOrder: 1,
    },
    {
      name: 'Bolsters & Blankets',
      description: 'Support props for restorative yoga',
      parentName: 'Accessories',
      sortOrder: 2,
    },
    {
      name: 'Meditation Cushions',
      description: 'Comfortable cushions for meditation practice',
      parentName: 'Meditation',
      sortOrder: 1,
    },
    {
      name: 'Incense & Candles',
      description: 'Aromatherapy for meditation',
      parentName: 'Meditation',
      sortOrder: 2,
    },
    {
      name: 'Supplements',
      description: 'Nutritional supplements for wellness',
      parentName: 'Wellness',
      sortOrder: 1,
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
