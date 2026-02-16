import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

const CAR_BRANDS = [
  'Abarth', 'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi',
  'Bentley', 'BMW', 'Bugatti', 'Cadillac', 'Chevrolet',
  'Ducati', 'Ford', 'HKS', 'Honda', 'Hyundai',
  'Isuzu', 'Jaguar', 'Lamborghini', 'Lancia', 'Land Rover',
  'LB Works', 'Lincoln', 'Lotus', 'Mazda', 'McLaren',
  'Mercedes-Benz', 'Nissan', 'Pagani', 'Pandem', 'Porsche',
  'Range Rover', 'Red Bull Racing', 'RUF', 'Shelby', 'SUBARU',
  'Tommykaira', 'Top Secret', 'Toyota', 'VeilSide', 'Volkswagen',
];

const MODEL_BRANDS = [
  'Mini GT', 'Tarmac Works', 'Hot Wheels', 'Inno64',
  'Pop Race', 'Tomica', 'Majorette',
];

async function main() {
  console.log('Seeding categories...');

  const carBrandData = CAR_BRANDS.map((name, i) => ({
    name,
    type: 'car_brand',
    is_active: true,
    display_order: i,
  }));

  const modelBrandData = MODEL_BRANDS.map((name, i) => ({
    name,
    type: 'model_brand',
    is_active: true,
    display_order: i,
  }));

  // Delete existing and re-create to avoid unique constraint issues
  const existingCount = await prisma.category.count();
  if (existingCount === 0) {
    await prisma.category.createMany({ data: [...carBrandData, ...modelBrandData] });
    console.log(`  ✓ ${CAR_BRANDS.length} car brands seeded`);
    console.log(`  ✓ ${MODEL_BRANDS.length} model brands seeded`);
  } else {
    console.log(`  ⚠ Skipped: ${existingCount} categories already exist`);
  }

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
