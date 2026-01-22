import * as dotenv from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('=== Danh sách tài khoản ===\n');

    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
    });

    if (users.length === 0) {
      console.log('❌ Chưa có tài khoản nào trong database.');
      console.log('💡 Chạy lệnh: npm run create:admin để tạo tài khoản admin đầu tiên.\n');
    } else {
      console.log(`Tìm thấy ${users.length} tài khoản:\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Full name: ${user.full_name || 'N/A'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.is_active ? '✅' : '❌'}`);
        console.log(`   Created: ${user.created_at.toLocaleString('vi-VN')}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách tài khoản:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
