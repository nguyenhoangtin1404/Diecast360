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

  const BATCH_SIZE = 20;
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(items.length / BATCH_SIZE)} (${chunk.length} items)...`);
    
    await Promise.all(
      chunk.map(async (item) => {
        try {
          await itemsService.syncVectorStore(item);
          // Optional: less verbose logging
          // console.log(`Indexed: ${item.name}`);
        } catch (error) {
          console.error(`Failed to index item ${item.id}:`, error);
        }
      })
    );
  }

  console.log('Indexing complete.');
  await app.close();
}

bootstrap();
