import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';
import * as readline from 'readline';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  try {
    console.log('=== Tạo tài khoản Admin ===\n');

    const email = await question('Email: ');
    if (!email) {
      console.error('Email không được để trống!');
      process.exit(1);
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error(`Email ${email} đã tồn tại!`);
      process.exit(1);
    }

    const password = await question('Password: ');
    if (!password || password.length < 6) {
      console.error('Password phải có ít nhất 6 ký tự!');
      process.exit(1);
    }

    const fullName = await question('Full name (optional): ');

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Tạo user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        full_name: fullName || null,
        role: 'admin',
        is_active: true,
      },
    });

    console.log('\n✅ Tạo tài khoản admin thành công!');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Full name: ${user.full_name || 'N/A'}`);
    console.log(`Role: ${user.role}`);
  } catch (error) {
    console.error('❌ Lỗi khi tạo tài khoản:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createAdmin();
