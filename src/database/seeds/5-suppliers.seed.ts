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
        postalCode: '94102',
      },
      taxId: 'TAX-001-YE',
      paymentTerms: {
        terms: 'Net 30',
        creditLimit: 50000,
        paymentMethod: 'Bank Transfer',
      },
      bankDetails: {
        accountName: 'Yoga Essentials Inc.',
        accountNumber: '1234567890',
        bankName: 'Wells Fargo',
        routingNumber: '121000248',
      },
      isActive: true,
      rating: 4.5,
      averageDeliveryDays: 3,
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
        postalCode: '10001',
      },
      taxId: 'TAX-002-MAC',
      paymentTerms: {
        terms: 'Net 45',
        creditLimit: 75000,
        paymentMethod: 'Credit Card',
      },
      bankDetails: {
        accountName: 'Mindful Apparel Co.',
        accountNumber: '9876543210',
        bankName: 'Chase Bank',
        routingNumber: '021000021',
      },
      isActive: true,
      rating: 4.8,
      averageDeliveryDays: 5,
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
        postalCode: '97201',
      },
      taxId: 'TAX-003-ZES',
      paymentTerms: {
        terms: 'Net 30',
        creditLimit: 40000,
        paymentMethod: 'Bank Transfer',
      },
      bankDetails: {
        accountName: 'Zen Equipment Supplies',
        accountNumber: '5555666677',
        bankName: 'US Bank',
        routingNumber: '123000220',
      },
      isActive: true,
      rating: 4.2,
      averageDeliveryDays: 4,
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
        postalCode: '78701',
      },
      taxId: 'TAX-004-HHP',
      paymentTerms: {
        terms: 'Net 30',
        creditLimit: 30000,
        paymentMethod: 'Check',
      },
      bankDetails: {
        accountName: 'Holistic Health Products',
        accountNumber: '7777888899',
        bankName: 'Bank of America',
        routingNumber: '111000025',
      },
      isActive: true,
      rating: 4.0,
      averageDeliveryDays: 7,
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
