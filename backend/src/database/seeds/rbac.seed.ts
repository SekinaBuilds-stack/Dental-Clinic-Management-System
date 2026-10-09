// backend/src/database/seeds/rbac.seed.ts
import { DataSource } from 'typeorm';

export async function seedRbac(dataSource: DataSource) {
  const roleRepo = dataSource.getRepository('Role');
  const permissionRepo = dataSource.getRepository('Permission');

  // 1. Define Core Permissions
  const permissionsData = [
    // Patients
    { name: 'patients:create', description: 'Pre-register and register patients' },
    { name: 'patients:read', description: 'View patient profiles and history' },
    { name: 'patients:update', description: 'Update patient demographics and alerts' },
    
    // Appointments & Scheduler
    { name: 'appointments:manage', description: 'Book, reschedule, and manage slots' },
    
    // Clinical EMR
    { name: 'emr:write', description: 'Create treatment plans, notes, and prescriptions' },
    { name: 'emr:read', description: 'View clinical records, odontogram, and images' },
    { name: 'lab:manage', description: 'Create and track laboratory work orders' },
    
    // Billing & Payments
    { name: 'billing:manage', description: 'Create bills, estimates, and day-books' },
    { name: 'payments:process', description: 'Process checkout, cash/card, and insurance' },
    { name: 'payments:reverse', description: 'Perform audited payment reversals' },
    
    // Retail Sales
    { name: 'retail:pos', description: 'Execute retail POS sales and returns' },
    
    // Inventory & Procurement
    { name: 'inventory:manage', description: 'Manage item master, GRN, and stock adjustments' },
    
    // Reports & Administration
    { name: 'reports:view', description: 'View financial, production, and audit reports' },
    { name: 'admin:users', description: 'Manage system users, roles, and configuration' },
  ];

  for (const p of permissionsData) {
    await permissionRepo.upsert(p, ['name']);
  }

  // 2. Define Roles and assign permissions (e.g., Clinic Manager gets all)
  const allPermissions = await permissionRepo.find();
  
  const rolesConfig = [
    { name: 'Clinic Manager / Admin', permissions: allPermissions },
    { 
      name: 'Dentist / Doctor', 
      permissions: allPermissions.filter(p => p.name.startsWith('emr:') || p.name.startsWith('lab:') || p.name.startsWith('patients:') || p.name === 'appointments:manage' || p.name === 'billing:manage')
    },
    { 
      name: 'Receptionist / Front Desk', 
      permissions: allPermissions.filter(p => p.name.startsWith('patients:') || p.name === 'appointments:manage' || p.name === 'billing:manage' || p.name.startsWith('retail:'))
    },
    {
      name: 'Cashier / Billing Officer',
      permissions: allPermissions.filter(p => p.name === 'billing:manage' || p.name.startsWith('payments:') || p.name === 'patients:read')
    },
    {
      name: 'Inventory / Store Officer',
      permissions: allPermissions.filter(p => p.name.startsWith('inventory:') || p.name === 'reports:view')
    },
    // Configure remaining roles similarly...
  ];

  for (const rc of rolesConfig) {
    let role = await roleRepo.findOne({ where: { name: rc.name } });
    if (!role) {
      role = roleRepo.create({ name: rc.name, permissions: rc.permissions });
    } else {
      role.permissions = rc.permissions;
    }
    await roleRepo.save(role);
  }
}