import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function createAdminQuick() {
  try {
    // pnpm/npm pass `--` before extra args; strip it so `pnpm run create:admin:quick -- user@x pass` works
    const args = process.argv.slice(2).filter((a) => a !== '--');
    const email = args[0];
    const password = args[1];

    if (!email || !password) {
      console.error('Usage: pnpm run create:admin:quick -- <email> <password>');
      process.exit(1);
    }
    if (password.length < 8) {
      console.error('Password must be at least 8 characters');
      process.exit(1);
    }

    console.log('=== Tạo / cập nhật tài khoản Admin ===\n');
    console.log(`Email: ${email}`);
    console.log('Password: [HIDDEN]\n');

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    let user: { id: string; email: string; full_name: string | null; role: string };
    let mode: 'created' | 'updated';

    if (existingUser) {
      await prisma.refreshToken.deleteMany({ where: { user_id: existingUser.id } });
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password_hash: passwordHash,
          role: 'admin',
          is_active: true,
          full_name: existingUser.full_name?.trim() ? existingUser.full_name : 'Administrator',
        },
      });
      mode = 'updated';
      console.log(`ℹ️  Email đã tồn tại — đã cập nhật mật khẩu, role admin, thu hồi refresh token cũ.\n`);
    } else {
      user = await prisma.user.create({
        data: {
          email,
          password_hash: passwordHash,
          full_name: 'Administrator',
          role: 'admin',
          is_active: true,
        },
      });
      mode = 'created';
    }

    const roleCount = await prisma.userShopRole.count({ where: { user_id: user.id } });
    if (roleCount === 0) {
      const slug = `s-${user.id.replace(/-/g, '')}`;
      await prisma.shop.create({
        data: {
          name: 'Cửa hàng mặc định',
          slug,
          is_active: true,
          user_roles: {
            create: {
              user_id: user.id,
              role: 'super_admin',
            },
          },
        },
      });
      console.log('ℹ️  Đã tạo shop mặc định và gán quyền super_admin cho tài khoản này.\n');
    }

    console.log(mode === 'created' ? '✅ Tạo tài khoản admin thành công!\n' : '✅ Cập nhật tài khoản admin thành công!\n');
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
