import { DataSource } from 'typeorm';
import { Customer } from '../../modules/customers/entities/customer.entity';

export async function seedCustomers(dataSource: DataSource): Promise<void> {
  const customerRepository = dataSource.getRepository(Customer);

  const customers = [
    {
      code: 'CUST001',
      firstName: 'Jessica',
      lastName: 'Anderson',
      email: 'jessica.anderson@email.com',
      phone: '+1-555-2001',
      dateOfBirth: new Date('1985-03-15'),
      address: {
        street: '123 Maple Street',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        postalCode: '90001',
      },
      loyaltyInfo: {
        membershipLevel: 'Gold',
        points: 1250,
        joinDate: new Date('2023-01-15'),
        lifetimeValue: 3500.00,
      },
      totalPurchases: 3500.00,
      isActive: true,
      notes: 'Preferred customer, interested in eco-friendly products',
    },
    {
      code: 'CUST002',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@email.com',
      phone: '+1-555-2002',
      dateOfBirth: new Date('1990-07-22'),
      address: {
        street: '456 Oak Avenue',
        city: 'Santa Monica',
        state: 'CA',
        country: 'USA',
        postalCode: '90402',
      },
      loyaltyInfo: {
        membershipLevel: 'Silver',
        points: 750,
        joinDate: new Date('2023-03-10'),
        lifetimeValue: 1800.00,
      },
      totalPurchases: 1800.00,
      isActive: true,
      notes: 'Regular customer, prefers morning classes',
    },
    {
      code: 'CUST003',
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.williams@email.com',
      phone: '+1-555-2003',
      dateOfBirth: new Date('1988-11-05'),
      address: {
        street: '789 Pine Road',
        city: 'Beverly Hills',
        state: 'CA',
        country: 'USA',
        postalCode: '90210',
      },
      loyaltyInfo: {
        membershipLevel: 'Platinum',
        points: 2500,
        joinDate: new Date('2022-09-01'),
        lifetimeValue: 7500.00,
      },
      totalPurchases: 7500.00,
      isActive: true,
      notes: 'VIP customer, interested in premium products and workshops',
    },
    {
      code: 'CUST004',
      firstName: 'David',
      lastName: 'Martinez',
      email: 'david.martinez@email.com',
      phone: '+1-555-2004',
      dateOfBirth: new Date('1992-02-18'),
      address: {
        street: '321 Elm Street',
        city: 'Pasadena',
        state: 'CA',
        country: 'USA',
        postalCode: '91101',
      },
      loyaltyInfo: {
        membershipLevel: 'Bronze',
        points: 350,
        joinDate: new Date('2023-06-20'),
        lifetimeValue: 850.00,
      },
      totalPurchases: 850.00,
      isActive: true,
      notes: 'New to yoga, interested in beginner classes',
    },
    {
      code: 'CUST005',
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'emily.johnson@email.com',
      phone: '+1-555-2005',
      dateOfBirth: new Date('1995-09-30'),
      address: {
        street: '654 Cedar Lane',
        city: 'Culver City',
        state: 'CA',
        country: 'USA',
        postalCode: '90232',
      },
      loyaltyInfo: {
        membershipLevel: 'Silver',
        points: 900,
        joinDate: new Date('2023-02-14'),
        lifetimeValue: 2100.00,
      },
      totalPurchases: 2100.00,
      isActive: true,
      notes: 'Interested in meditation and wellness products',
    },
    {
      code: 'CUST006',
      firstName: 'Robert',
      lastName: 'Taylor',
      email: 'robert.taylor@email.com',
      phone: '+1-555-2006',
      dateOfBirth: new Date('1987-05-12'),
      address: {
        street: '987 Willow Drive',
        city: 'Long Beach',
        state: 'CA',
        country: 'USA',
        postalCode: '90802',
      },
      loyaltyInfo: {
        membershipLevel: 'Gold',
        points: 1500,
        joinDate: new Date('2022-11-05'),
        lifetimeValue: 4200.00,
      },
      totalPurchases: 4200.00,
      isActive: true,
      notes: 'Regular purchaser of supplements and wellness products',
    },
    {
      code: 'CUST007',
      firstName: 'Amanda',
      lastName: 'Brown',
      email: 'amanda.brown@email.com',
      phone: '+1-555-2007',
      dateOfBirth: new Date('1993-08-25'),
      address: {
        street: '147 Birch Avenue',
        city: 'Venice',
        state: 'CA',
        country: 'USA',
        postalCode: '90291',
      },
      loyaltyInfo: {
        membershipLevel: 'Bronze',
        points: 450,
        joinDate: new Date('2023-05-18'),
        lifetimeValue: 1200.00,
      },
      totalPurchases: 1200.00,
      isActive: true,
      notes: 'Yoga instructor, gets instructor discount',
    },
    {
      code: 'CUST008',
      firstName: 'Christopher',
      lastName: 'Davis',
      email: 'chris.davis@email.com',
      phone: '+1-555-2008',
      dateOfBirth: new Date('1989-12-08'),
      address: {
        street: '258 Spruce Street',
        city: 'Glendale',
        state: 'CA',
        country: 'USA',
        postalCode: '91201',
      },
      loyaltyInfo: {
        membershipLevel: 'Silver',
        points: 800,
        joinDate: new Date('2023-04-01'),
        lifetimeValue: 1950.00,
      },
      totalPurchases: 1950.00,
      isActive: true,
      notes: 'Interested in men\'s apparel and accessories',
    },
    {
      code: 'CUST009',
      firstName: 'Lisa',
      lastName: 'Wilson',
      email: 'lisa.wilson@email.com',
      phone: '+1-555-2009',
      dateOfBirth: new Date('1991-04-17'),
      address: {
        street: '369 Ash Boulevard',
        city: 'Burbank',
        state: 'CA',
        country: 'USA',
        postalCode: '91502',
      },
      loyaltyInfo: {
        membershipLevel: 'Gold',
        points: 1800,
        joinDate: new Date('2022-12-20'),
        lifetimeValue: 5100.00,
      },
      totalPurchases: 5100.00,
      isActive: true,
      notes: 'Frequent buyer, loves trying new products',
    },
    {
      code: 'CUST010',
      firstName: 'James',
      lastName: 'Moore',
      email: 'james.moore@email.com',
      phone: '+1-555-2010',
      dateOfBirth: new Date('1986-06-29'),
      address: {
        street: '741 Redwood Court',
        city: 'Torrance',
        state: 'CA',
        country: 'USA',
        postalCode: '90501',
      },
      loyaltyInfo: {
        membershipLevel: 'Bronze',
        points: 300,
        joinDate: new Date('2023-07-10'),
        lifetimeValue: 680.00,
      },
      totalPurchases: 680.00,
      isActive: true,
      notes: 'Recently joined, interested in beginner equipment',
    },
  ];

  for (const customerData of customers) {
    const existingCustomer = await customerRepository.findOne({
      where: { code: customerData.code },
    });

    if (!existingCustomer) {
      const customer = customerRepository.create(customerData);
      await customerRepository.save(customer);
      console.log(`✓ Created customer: ${customerData.firstName} ${customerData.lastName}`);
    } else {
      console.log(`- Customer already exists: ${customerData.firstName} ${customerData.lastName}`);
    }
  }
}
