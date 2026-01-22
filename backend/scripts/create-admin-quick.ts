import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function createAdminQuick() {
  try {
    const email = process.argv[2] || 'admin@diecast360.com';
    const password = process.argv[3] || 'admin';

    console.log('=== Tạo tài khoản Admin ===\n');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}\n`);

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error(`❌ Email ${email} đã tồn tại!`);
      process.exit(1);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Tạo user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        full_name: 'Administrator',
        role: 'admin',
        is_active: true,
      },
    });

    console.log('✅ Tạo tài khoản admin thành công!\n');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Full name: ${user.full_name}`);
    console.log(`Role: ${user.role}`);
    console.log(`\n💡 Bạn có thể đăng nhập tại: http://localhost:5173/admin/login`);
  } catch (error) {
    console.error('❌ Lỗi khi tạo tài khoản:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminQuick();
