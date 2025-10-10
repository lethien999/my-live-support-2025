import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create departments
  const techDept = await prisma.department.upsert({
    where: { name: 'Technical Support' },
    update: {},
    create: {
      name: 'Technical Support',
    },
  });

  const salesDept = await prisma.department.upsert({
    where: { name: 'Sales Support' },
    update: {},
    create: {
      name: 'Sales Support',
    },
  });

  console.log('✅ Departments created');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.io' },
    update: {},
    create: {
      email: 'admin@demo.io',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });

  const agent1 = await prisma.user.upsert({
    where: { email: 'agent1@demo.io' },
    update: {},
    create: {
      email: 'agent1@demo.io',
      passwordHash: agentPassword,
      name: 'Agent One',
      role: 'agent',
    },
  });

  const agent2 = await prisma.user.upsert({
    where: { email: 'agent2@demo.io' },
    update: {},
    create: {
      email: 'agent2@demo.io',
      passwordHash: agentPassword,
      name: 'Agent Two',
      role: 'agent',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'user@demo.io' },
    update: {},
    create: {
      email: 'user@demo.io',
      passwordHash: userPassword,
      name: 'Customer User',
      role: 'customer',
    },
  });

  console.log('✅ Users created');

  // Create sample tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      subject: 'Cannot login to my account',
      description: 'I am unable to login to my account. Getting error message.',
      status: 'Open',
      priority: 'High',
      customerId: customer.id,
      departmentId: techDept.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      subject: 'Need help with pricing',
      description: 'I would like to know more about your pricing plans.',
      status: 'Pending',
      priority: 'Medium',
      customerId: customer.id,
      assigneeId: agent1.id,
      departmentId: salesDept.id,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      subject: 'Feature request',
      description: 'Would like to request a new feature for the dashboard.',
      status: 'Resolved',
      priority: 'Low',
      customerId: customer.id,
      assigneeId: agent2.id,
      departmentId: techDept.id,
    },
  });

  console.log('✅ Tickets created');

  // Create rooms for tickets
  await prisma.room.createMany({
    data: [
      { ticketId: ticket1.id },
      { ticketId: ticket2.id },
      { ticketId: ticket3.id },
    ],
  });

  console.log('✅ Rooms created');

  // Create sample messages
  const rooms = await prisma.room.findMany({
    where: { ticketId: { in: [ticket1.id, ticket2.id, ticket3.id] } },
  });

  for (const room of rooms) {
    await prisma.message.createMany({
      data: [
        {
          roomId: room.id,
          senderId: customer.id,
          type: 'text',
          content: 'Hello, I need help with my issue.',
        },
        {
          roomId: room.id,
          senderId: agent1.id,
          type: 'text',
          content: 'Hello! I will help you with that. Let me check your account.',
        },
        {
          roomId: room.id,
          senderId: customer.id,
          type: 'text',
          content: 'Thank you for your help!',
        },
      ],
    });
  }

  console.log('✅ Messages created');

  // Create sample rating for resolved ticket
  await prisma.rating.create({
    data: {
      ticketId: ticket3.id,
      score: 5,
      comment: 'Great service! Very helpful agent.',
    },
  });

  console.log('✅ Rating created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Sample accounts:');
  console.log('Admin: admin@demo.io / admin123');
  console.log('Agent 1: agent1@demo.io / agent123');
  console.log('Agent 2: agent2@demo.io / agent123');
  console.log('Customer: user@demo.io / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
