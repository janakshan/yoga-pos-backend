import { DataSource } from 'typeorm';
import { Role } from '../../modules/roles/entities/role.entity';
import { Permission } from '../../modules/permissions/entities/permission.entity';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  // Get all permissions
  const allPermissions = await permissionRepository.find();

  // Define roles with their permission codes
  const rolesData = [
    {
      code: 'admin',
      name: 'Administrator',
      description: 'Full system access with all permissions',
      isSystem: true,
      isActive: true,
      permissionCodes: allPermissions.map((p) => p.code), // All permissions
    },
    {
      code: 'manager',
      name: 'Manager',
      description: 'Branch manager with most permissions except system administration',
      isSystem: false,
      isActive: true,
      permissionCodes: [
        // Users
        'users:read', 'users:update',
        // Products
        'products:read', 'products:create', 'products:update',
        // Categories
        'categories:read', 'categories:create', 'categories:update',
        // Sales
        'sales:read', 'sales:create', 'sales:update',
        // Customers
        'customers:read', 'customers:create', 'customers:update',
        // Invoices
        'invoices:read', 'invoices:create', 'invoices:update',
        // Payments
        'payments:read', 'payments:create', 'payments:update',
        // Inventory
        'inventory:read', 'inventory:update', 'inventory:transfer',
        // Suppliers
        'suppliers:read', 'suppliers:create', 'suppliers:update',
        // Purchase Orders
        'purchase-orders:read', 'purchase-orders:create', 'purchase-orders:update',
        // Branches
        'branches:read',
        // Expenses
        'expenses:read', 'expenses:create', 'expenses:update',
        // Reports
        'reports:sales', 'reports:inventory', 'reports:financial',
      ],
    },
    {
      code: 'cashier',
      name: 'Cashier',
      description: 'Point of sale operations and basic customer management',
      isSystem: false,
      isActive: true,
      permissionCodes: [
        // Products
        'products:read',
        // Categories
        'categories:read',
        // Sales
        'sales:read', 'sales:create',
        // Customers
        'customers:read', 'customers:create', 'customers:update',
        // Invoices
        'invoices:read', 'invoices:create',
        // Payments
        'payments:read', 'payments:create',
        // Inventory
        'inventory:read',
      ],
    },
    {
      code: 'inventory-manager',
      name: 'Inventory Manager',
      description: 'Inventory and stock management permissions',
      isSystem: false,
      isActive: true,
      permissionCodes: [
        // Products
        'products:read', 'products:create', 'products:update',
        // Categories
        'categories:read', 'categories:create', 'categories:update',
        // Inventory
        'inventory:read', 'inventory:update', 'inventory:transfer',
        // Suppliers
        'suppliers:read', 'suppliers:create', 'suppliers:update',
        // Purchase Orders
        'purchase-orders:read', 'purchase-orders:create', 'purchase-orders:update',
        // Reports
        'reports:inventory',
      ],
    },
    {
      code: 'sales-associate',
      name: 'Sales Associate',
      description: 'Sales and customer service permissions',
      isSystem: false,
      isActive: true,
      permissionCodes: [
        // Products
        'products:read',
        // Categories
        'categories:read',
        // Sales
        'sales:read', 'sales:create',
        // Customers
        'customers:read', 'customers:create', 'customers:update',
        // Invoices
        'invoices:read',
        // Payments
        'payments:read',
      ],
    },
    {
      code: 'accountant',
      name: 'Accountant',
      description: 'Financial and reporting permissions',
      isSystem: false,
      isActive: true,
      permissionCodes: [
        // Sales
        'sales:read',
        // Invoices
        'invoices:read', 'invoices:update',
        // Payments
        'payments:read', 'payments:create', 'payments:update',
        // Expenses
        'expenses:read', 'expenses:create', 'expenses:update',
        // Purchase Orders
        'purchase-orders:read',
        // Reports
        'reports:sales', 'reports:financial',
      ],
    },
  ];

  for (const roleData of rolesData) {
    const { permissionCodes, ...roleInfo } = roleData;

    let role = await roleRepository.findOne({
      where: { code: roleData.code },
      relations: ['permissions'],
    });

    if (!role) {
      role = roleRepository.create(roleInfo);
    } else {
      Object.assign(role, roleInfo);
    }

    // Assign permissions
    const permissions = await permissionRepository.find({
      where: permissionCodes.map((code) => ({ code })),
    });

    role.permissions = permissions;
    await roleRepository.save(role);

    console.log(`✓ Created/Updated role: ${roleData.name} with ${permissions.length} permissions`);
  }
}
