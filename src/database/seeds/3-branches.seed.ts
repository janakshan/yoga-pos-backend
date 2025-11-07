import { DataSource } from 'typeorm';
import { Branch } from '../../modules/branches/entities/branch.entity';

export async function seedBranches(dataSource: DataSource): Promise<void> {
  const branchRepository = dataSource.getRepository(Branch);

  const branches = [
    {
      code: 'HQ001',
      name: 'Headquarters - Downtown',
      address: '123 Main Street',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      zipCode: '90001',
      phone: '+1-555-0101',
      email: 'hq@yogapos.com',
      isActive: true,
      settings: {
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        taxRate: 8.5,
        receiptFooter: 'Thank you for your purchase!',
        allowBackorder: true,
        autoApproveReturns: false,
      },
    },
    {
      code: 'BR001',
      name: 'Westside Branch',
      address: '456 Ocean Avenue',
      city: 'Santa Monica',
      state: 'CA',
      country: 'USA',
      zipCode: '90401',
      phone: '+1-555-0102',
      email: 'westside@yogapos.com',
      isActive: true,
      settings: {
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        taxRate: 9.5,
        receiptFooter: 'Thank you! Visit us again.',
        allowBackorder: false,
        autoApproveReturns: false,
      },
    },
    {
      code: 'BR002',
      name: 'Hollywood Branch',
      address: '789 Sunset Boulevard',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      zipCode: '90028',
      phone: '+1-555-0103',
      email: 'hollywood@yogapos.com',
      isActive: true,
      settings: {
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        taxRate: 8.5,
        receiptFooter: 'Namaste! Come back soon.',
        allowBackorder: true,
        autoApproveReturns: true,
      },
    },
  ];

  for (const branchData of branches) {
    const existingBranch = await branchRepository.findOne({
      where: { code: branchData.code },
    });

    if (!existingBranch) {
      const branch = branchRepository.create(branchData);
      await branchRepository.save(branch);
      console.log(`✓ Created branch: ${branchData.name}`);
    } else {
      console.log(`- Branch already exists: ${branchData.name}`);
    }
  }
}
