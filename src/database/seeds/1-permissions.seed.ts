import { DataSource } from 'typeorm';
import { Permission } from '../../modules/permissions/entities/permission.entity';

export async function seedPermissions(dataSource: DataSource): Promise<void> {
  const permissionRepository = dataSource.getRepository(Permission);

  const permissions = [
    // User permissions
    { code: 'users:read', name: 'View Users', description: 'View user information', resource: 'users', action: 'read' },
    { code: 'users:create', name: 'Create Users', description: 'Create new users', resource: 'users', action: 'create' },
    { code: 'users:update', name: 'Update Users', description: 'Update user information', resource: 'users', action: 'update' },
    { code: 'users:delete', name: 'Delete Users', description: 'Delete users', resource: 'users', action: 'delete' },

    // Role permissions
    { code: 'roles:read', name: 'View Roles', description: 'View role information', resource: 'roles', action: 'read' },
    { code: 'roles:create', name: 'Create Roles', description: 'Create new roles', resource: 'roles', action: 'create' },
    { code: 'roles:update', name: 'Update Roles', description: 'Update role information', resource: 'roles', action: 'update' },
    { code: 'roles:delete', name: 'Delete Roles', description: 'Delete roles', resource: 'roles', action: 'delete' },

    // Product permissions
    { code: 'products:read', name: 'View Products', description: 'View product information', resource: 'products', action: 'read' },
    { code: 'products:create', name: 'Create Products', description: 'Create new products', resource: 'products', action: 'create' },
    { code: 'products:update', name: 'Update Products', description: 'Update product information', resource: 'products', action: 'update' },
    { code: 'products:delete', name: 'Delete Products', description: 'Delete products', resource: 'products', action: 'delete' },

    // Category permissions
    { code: 'categories:read', name: 'View Categories', description: 'View category information', resource: 'categories', action: 'read' },
    { code: 'categories:create', name: 'Create Categories', description: 'Create new categories', resource: 'categories', action: 'create' },
    { code: 'categories:update', name: 'Update Categories', description: 'Update category information', resource: 'categories', action: 'update' },
    { code: 'categories:delete', name: 'Delete Categories', description: 'Delete categories', resource: 'categories', action: 'delete' },

    // Sale permissions
    { code: 'sales:read', name: 'View Sales', description: 'View sale information', resource: 'sales', action: 'read' },
    { code: 'sales:create', name: 'Create Sales', description: 'Create new sales', resource: 'sales', action: 'create' },
    { code: 'sales:update', name: 'Update Sales', description: 'Update sale information', resource: 'sales', action: 'update' },
    { code: 'sales:delete', name: 'Delete Sales', description: 'Delete sales', resource: 'sales', action: 'delete' },

    // Customer permissions
    { code: 'customers:read', name: 'View Customers', description: 'View customer information', resource: 'customers', action: 'read' },
    { code: 'customers:create', name: 'Create Customers', description: 'Create new customers', resource: 'customers', action: 'create' },
    { code: 'customers:update', name: 'Update Customers', description: 'Update customer information', resource: 'customers', action: 'update' },
    { code: 'customers:delete', name: 'Delete Customers', description: 'Delete customers', resource: 'customers', action: 'delete' },

    // Invoice permissions
    { code: 'invoices:read', name: 'View Invoices', description: 'View invoice information', resource: 'invoices', action: 'read' },
    { code: 'invoices:create', name: 'Create Invoices', description: 'Create new invoices', resource: 'invoices', action: 'create' },
    { code: 'invoices:update', name: 'Update Invoices', description: 'Update invoice information', resource: 'invoices', action: 'update' },
    { code: 'invoices:delete', name: 'Delete Invoices', description: 'Delete invoices', resource: 'invoices', action: 'delete' },

    // Payment permissions
    { code: 'payments:read', name: 'View Payments', description: 'View payment information', resource: 'payments', action: 'read' },
    { code: 'payments:create', name: 'Create Payments', description: 'Create new payments', resource: 'payments', action: 'create' },
    { code: 'payments:update', name: 'Update Payments', description: 'Update payment information', resource: 'payments', action: 'update' },
    { code: 'payments:delete', name: 'Delete Payments', description: 'Delete payments', resource: 'payments', action: 'delete' },

    // Inventory permissions
    { code: 'inventory:read', name: 'View Inventory', description: 'View inventory information', resource: 'inventory', action: 'read' },
    { code: 'inventory:update', name: 'Update Inventory', description: 'Update inventory levels', resource: 'inventory', action: 'update' },
    { code: 'inventory:transfer', name: 'Transfer Inventory', description: 'Transfer inventory between locations', resource: 'inventory', action: 'transfer' },

    // Supplier permissions
    { code: 'suppliers:read', name: 'View Suppliers', description: 'View supplier information', resource: 'suppliers', action: 'read' },
    { code: 'suppliers:create', name: 'Create Suppliers', description: 'Create new suppliers', resource: 'suppliers', action: 'create' },
    { code: 'suppliers:update', name: 'Update Suppliers', description: 'Update supplier information', resource: 'suppliers', action: 'update' },
    { code: 'suppliers:delete', name: 'Delete Suppliers', description: 'Delete suppliers', resource: 'suppliers', action: 'delete' },

    // Purchase Order permissions
    { code: 'purchase-orders:read', name: 'View Purchase Orders', description: 'View purchase order information', resource: 'purchase-orders', action: 'read' },
    { code: 'purchase-orders:create', name: 'Create Purchase Orders', description: 'Create new purchase orders', resource: 'purchase-orders', action: 'create' },
    { code: 'purchase-orders:update', name: 'Update Purchase Orders', description: 'Update purchase order information', resource: 'purchase-orders', action: 'update' },
    { code: 'purchase-orders:delete', name: 'Delete Purchase Orders', description: 'Delete purchase orders', resource: 'purchase-orders', action: 'delete' },

    // Branch permissions
    { code: 'branches:read', name: 'View Branches', description: 'View branch information', resource: 'branches', action: 'read' },
    { code: 'branches:create', name: 'Create Branches', description: 'Create new branches', resource: 'branches', action: 'create' },
    { code: 'branches:update', name: 'Update Branches', description: 'Update branch information', resource: 'branches', action: 'update' },
    { code: 'branches:delete', name: 'Delete Branches', description: 'Delete branches', resource: 'branches', action: 'delete' },

    // Expense permissions
    { code: 'expenses:read', name: 'View Expenses', description: 'View expense information', resource: 'expenses', action: 'read' },
    { code: 'expenses:create', name: 'Create Expenses', description: 'Create new expenses', resource: 'expenses', action: 'create' },
    { code: 'expenses:update', name: 'Update Expenses', description: 'Update expense information', resource: 'expenses', action: 'update' },
    { code: 'expenses:delete', name: 'Delete Expenses', description: 'Delete expenses', resource: 'expenses', action: 'delete' },

    // Report permissions
    { code: 'reports:sales', name: 'View Sales Reports', description: 'View sales reports', resource: 'reports', action: 'sales' },
    { code: 'reports:inventory', name: 'View Inventory Reports', description: 'View inventory reports', resource: 'reports', action: 'inventory' },
    { code: 'reports:financial', name: 'View Financial Reports', description: 'View financial reports', resource: 'reports', action: 'financial' },
  ];

  for (const permissionData of permissions) {
    const existingPermission = await permissionRepository.findOne({
      where: { code: permissionData.code },
    });

    if (!existingPermission) {
      const permission = permissionRepository.create(permissionData);
      await permissionRepository.save(permission);
      console.log(`✓ Created permission: ${permissionData.name}`);
    } else {
      console.log(`- Permission already exists: ${permissionData.name}`);
    }
  }
}
