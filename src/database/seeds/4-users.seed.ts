import { DataSource } from 'typeorm';
import { User, UserStatus } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { Branch } from '../../modules/branches/entities/branch.entity';
import * as bcrypt from 'bcrypt';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);
  const branchRepository = dataSource.getRepository(Branch);

  // Get roles
  const adminRole = await roleRepository.findOne({ where: { code: 'admin' } });
  const managerRole = await roleRepository.findOne({ where: { code: 'manager' } });
  const cashierRole = await roleRepository.findOne({ where: { code: 'cashier' } });
  const inventoryManagerRole = await roleRepository.findOne({ where: { code: 'inventory-manager' } });
  const salesAssociateRole = await roleRepository.findOne({ where: { code: 'sales-associate' } });
  const accountantRole = await roleRepository.findOne({ where: { code: 'accountant' } });

  // Get branches
  const hqBranch = await branchRepository.findOne({ where: { code: 'HQ001' } });
  const westsideBranch = await branchRepository.findOne({ where: { code: 'BR001' } });
  const hollywoodBranch = await branchRepository.findOne({ where: { code: 'BR002' } });

  const users = [
    {
      username: 'admin',
      email: 'admin@yogapos.com',
      password: await bcrypt.hash('Admin123!', 10),
      pin: await bcrypt.hash('1234', 10),
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+1-555-0001',
      status: UserStatus.ACTIVE,
      branch: hqBranch,
      roles: [adminRole],
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },
      staffProfile: {
        employeeId: 'EMP001',
        position: 'System Administrator',
        department: 'IT',
        employmentType: 'Full-time',
        hireDate: new Date('2023-01-01'),
        salary: 80000,
      },
    },
    {
      username: 'manager1',
      email: 'manager1@yogapos.com',
      password: await bcrypt.hash('Manager123!', 10),
      pin: await bcrypt.hash('2345', 10),
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1-555-0002',
      status: UserStatus.ACTIVE,
      branch: hqBranch,
      roles: [managerRole],
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          sms: true,
          push: true,
        },
      },
      staffProfile: {
        employeeId: 'EMP002',
        position: 'Store Manager',
        department: 'Operations',
        employmentType: 'Full-time',
        hireDate: new Date('2023-02-15'),
        salary: 60000,
      },
    },
    {
      username: 'cashier1',
      email: 'cashier1@yogapos.com',
      password: await bcrypt.hash('Cashier123!', 10),
      pin: await bcrypt.hash('3456', 10),
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1-555-0003',
      status: UserStatus.ACTIVE,
      branch: westsideBranch,
      roles: [cashierRole],
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          sms: false,
          push: false,
        },
      },
      staffProfile: {
        employeeId: 'EMP003',
        position: 'Cashier',
        department: 'Sales',
        employmentType: 'Part-time',
        hireDate: new Date('2023-03-20'),
        salary: 35000,
      },
    },
    {
      username: 'cashier2',
      email: 'cashier2@yogapos.com',
      password: await bcrypt.hash('Cashier123!', 10),
      pin: await bcrypt.hash('4567', 10),
      firstName: 'Mike',
      lastName: 'Davis',
      phone: '+1-555-0004',
      status: UserStatus.ACTIVE,
      branch: hollywoodBranch,
      roles: [cashierRole],
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: false,
          sms: false,
          push: true,
        },
      },
      staffProfile: {
        employeeId: 'EMP004',
        position: 'Cashier',
        department: 'Sales',
        employmentType: 'Part-time',
        hireDate: new Date('2023-04-10'),
        salary: 35000,
      },
    },
    {
      username: 'inventory1',
      email: 'inventory@yogapos.com',
      password: await bcrypt.hash('Inventory123!', 10),
      pin: await bcrypt.hash('5678', 10),
      firstName: 'Emily',
      lastName: 'Brown',
      phone: '+1-555-0005',
      status: UserStatus.ACTIVE,
      branch: hqBranch,
      roles: [inventoryManagerRole],
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          sms: true,
          push: true,
        },
      },
      staffProfile: {
        employeeId: 'EMP005',
        position: 'Inventory Manager',
        department: 'Operations',
        employmentType: 'Full-time',
        hireDate: new Date('2023-05-01'),
        salary: 55000,
      },
    },
    {
      username: 'sales1',
      email: 'sales@yogapos.com',
      password: await bcrypt.hash('Sales123!', 10),
      pin: await bcrypt.hash('6789', 10),
      firstName: 'David',
      lastName: 'Wilson',
      phone: '+1-555-0006',
      status: UserStatus.ACTIVE,
      branch: westsideBranch,
      roles: [salesAssociateRole],
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },
      staffProfile: {
        employeeId: 'EMP006',
        position: 'Sales Associate',
        department: 'Sales',
        employmentType: 'Full-time',
        hireDate: new Date('2023-06-15'),
        salary: 45000,
      },
    },
    {
      username: 'accountant1',
      email: 'accountant@yogapos.com',
      password: await bcrypt.hash('Accountant123!', 10),
      pin: await bcrypt.hash('7890', 10),
      firstName: 'Lisa',
      lastName: 'Martinez',
      phone: '+1-555-0007',
      status: UserStatus.ACTIVE,
      branch: hqBranch,
      roles: [accountantRole],
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          sms: false,
          push: false,
        },
      },
      staffProfile: {
        employeeId: 'EMP007',
        position: 'Accountant',
        department: 'Finance',
        employmentType: 'Full-time',
        hireDate: new Date('2023-07-01'),
        salary: 65000,
      },
    },
  ];

  for (const userData of users) {
    const existingUser = await userRepository.findOne({
      where: { username: userData.username },
    });

    if (!existingUser) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(`✓ Created user: ${userData.username} (${userData.firstName} ${userData.lastName})`);
    } else {
      console.log(`- User already exists: ${userData.username}`);
    }
  }

  console.log('\n=== Test User Credentials ===');
  console.log('Admin: admin / Admin123!');
  console.log('Manager: manager1 / Manager123!');
  console.log('Cashier: cashier1 / Cashier123!');
  console.log('Inventory: inventory1 / Inventory123!');
  console.log('Sales: sales1 / Sales123!');
  console.log('Accountant: accountant1 / Accountant123!');
  console.log('============================\n');
}
