import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const args = process.argv.slice(2).filter((a) => a !== '--');
    const email = args[0] || 'admin@diecast360.com';
    const password = args[1] || 'admin';

    console.log('=== Reset mật khẩu Admin ===\n');
    console.log(`Email: ${email}`);
    console.log(`Password mới: ${password}\n`);

    // Tìm user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ Không tìm thấy user với email: ${email}`);
      process.exit(1);
    }

    // Hash password mới
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Cập nhật password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
      },
    });

    console.log('✅ Reset mật khẩu thành công!\n');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Full name: ${user.full_name}`);
    console.log(`Role: ${user.role}`);
    console.log(`\n💡 Bạn có thể đăng nhập tại: http://localhost:5173/admin/login`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error('❌ Lỗi khi reset mật khẩu:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
