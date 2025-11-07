import { DataSource } from 'typeorm';
import { Supplier } from '../../modules/suppliers/entities/supplier.entity';

export async function seedSuppliers(dataSource: DataSource): Promise<void> {
  const supplierRepository = dataSource.getRepository(Supplier);

  const suppliers = [
    {
      code: 'SUP001',
      name: 'Yoga Essentials Inc.',
      contactPerson: 'Michael Chen',
      email: 'orders@yogaessentials.com',
      phone: '+1-555-1001',
      address: {
        street: '100 Wellness Way',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        zipCode: '94102',
      },
      taxId: 'TAX-001-YE',
      paymentTerms: {
        terms: 'Net 30',
        days: 30,
      },
      bankDetails: {
        bankName: 'Wells Fargo',
        accountNumber: '1234567890',
      },
      isActive: true,
      rating: 4.5,
      totalPurchased: 0,
      totalOwed: 0,
      notes: 'Primary supplier for yoga mats and accessories',
    },
    {
      code: 'SUP002',
      name: 'Mindful Apparel Co.',
      contactPerson: 'Sarah Thompson',
      email: 'wholesale@mindfulapparel.com',
      phone: '+1-555-1002',
      address: {
        street: '250 Fashion Avenue',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
      },
      taxId: 'TAX-002-MAC',
      paymentTerms: {
        terms: 'Net 45',
        days: 45,
      },
      bankDetails: {
        bankName: 'Chase Bank',
        accountNumber: '9876543210',
      },
      isActive: true,
      rating: 4.8,
      totalPurchased: 0,
      totalOwed: 0,
      notes: 'Exclusive supplier for eco-friendly yoga wear',
    },
    {
      code: 'SUP003',
      name: 'Zen Equipment Supplies',
      contactPerson: 'Robert Kim',
      email: 'info@zenequipment.com',
      phone: '+1-555-1003',
      address: {
        street: '789 Industrial Park Drive',
        city: 'Portland',
        state: 'OR',
        country: 'USA',
        zipCode: '97201',
      },
      taxId: 'TAX-003-ZES',
      paymentTerms: {
        terms: 'Net 30',
        days: 30,
      },
      bankDetails: {
        bankName: 'US Bank',
        accountNumber: '5555666677',
      },
      isActive: true,
      rating: 4.2,
      totalPurchased: 0,
      totalOwed: 0,
      notes: 'Supplier for meditation cushions and props',
    },
    {
      code: 'SUP004',
      name: 'Holistic Health Products',
      contactPerson: 'Jennifer Martinez',
      email: 'orders@holistichealth.com',
      phone: '+1-555-1004',
      address: {
        street: '456 Wellness Boulevard',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        zipCode: '78701',
      },
      taxId: 'TAX-004-HHP',
      paymentTerms: {
        terms: 'Net 30',
        days: 30,
      },
      bankDetails: {
        bankName: 'Bank of America',
        accountNumber: '7777888899',
      },
      isActive: true,
      rating: 4.0,
      totalPurchased: 0,
      totalOwed: 0,
      notes: 'Supplements and wellness products',
    },
  ];

  for (const supplierData of suppliers) {
    const existingSupplier = await supplierRepository.findOne({
      where: { code: supplierData.code },
    });

    if (!existingSupplier) {
      const supplier = supplierRepository.create(supplierData);
      await supplierRepository.save(supplier);
      console.log(`✓ Created supplier: ${supplierData.name}`);
    } else {
      console.log(`- Supplier already exists: ${supplierData.name}`);
    }
  }
}
