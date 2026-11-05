import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Database ---');

  // 1. Roles
  const hrRole = await prisma.role.upsert({
    where: { name: 'HR_ADMIN' },
    update: {},
    create: { name: 'HR_ADMIN' },
  });

  const empRole = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: { name: 'EMPLOYEE' },
  });

  console.log(`Roles ensured: HR_ADMIN (${hrRole.id}), EMPLOYEE (${empRole.id})`);

  // Default hashed password: Password123!
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 2. HR Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'hr@dexa.com' },
    update: { passwordHash, isActive: true },
    create: {
      email: 'hr@dexa.com',
      passwordHash,
      roleId: hrRole.id,
      isActive: true,
    },
  });
  console.log(`HR Admin user ensured: hr@dexa.com (ID: ${adminUser.id})`);

  // 3. Employee User & Employee Profile
  const empUser = await prisma.user.upsert({
    where: { email: 'employee@dexa.com' },
    update: { passwordHash, isActive: true },
    create: {
      email: 'employee@dexa.com',
      passwordHash,
      roleId: empRole.id,
      isActive: true,
    },
  });

  const empProfile = await prisma.employee.upsert({
    where: { employeeNumber: 'EMP-001' },
    update: {
      fullName: 'Budi Pratama',
      department: 'Engineering',
      position: 'Senior Software Engineer',
      phone: '081234567890',
    },
    create: {
      userId: empUser.id,
      employeeNumber: 'EMP-001',
      fullName: 'Budi Pratama',
      department: 'Engineering',
      position: 'Senior Software Engineer',
      phone: '081234567890',
    },
  });
  console.log(`Employee profile ensured: EMP-001 - ${empProfile.fullName} (User ID: ${empUser.id})`);

  // 4. Second Employee for testing
  const empUser2 = await prisma.user.upsert({
    where: { email: 'siti@dexa.com' },
    update: { passwordHash, isActive: true },
    create: {
      email: 'siti@dexa.com',
      passwordHash,
      roleId: empRole.id,
      isActive: true,
    },
  });

  const empProfile2 = await prisma.employee.upsert({
    where: { employeeNumber: 'EMP-002' },
    update: {
      fullName: 'Siti Rahmawati',
      department: 'Product Management',
      position: 'Product Owner',
      phone: '081987654321',
    },
    create: {
      userId: empUser2.id,
      employeeNumber: 'EMP-002',
      fullName: 'Siti Rahmawati',
      department: 'Product Management',
      position: 'Product Owner',
      phone: '081987654321',
    },
  });
  console.log(`Employee profile ensured: EMP-002 - ${empProfile2.fullName} (User ID: ${empUser2.id})`);

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

