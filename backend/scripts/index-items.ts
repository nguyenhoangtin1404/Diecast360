import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ItemsService } from '../src/items/items.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemsService = app.get(ItemsService);
  const prisma = app.get(PrismaService);

  console.log('Starting indexing...');

  const items = await prisma.item.findMany({
    where: { deleted_at: null, is_public: true },
  });

  console.log(`Found ${items.length} items to index.`);

  for (const item of items) {
    console.log(`Indexing item: ${item.name} (${item.id})`);
    await itemsService.syncVectorStore(item);
  }

  console.log('Indexing complete.');
  await app.close();
}

bootstrap();
