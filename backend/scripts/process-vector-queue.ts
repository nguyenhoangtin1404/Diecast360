import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ItemsService } from '../src/items/items.service';

function parseLimitArg(): number {
  const args = process.argv.slice(2);
  let limit = 20;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--limit=')) {
      const value = parseInt(arg.split('=')[1], 10);
      if (!Number.isNaN(value) && value > 0) {
        limit = value;
      }
    } else if (arg === '--limit' && i + 1 < args.length) {
      const value = parseInt(args[i + 1], 10);
      if (!Number.isNaN(value) && value > 0) {
        limit = value;
      }
    }
  }

  return limit;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemsService = app.get(ItemsService);

  const limit = parseLimitArg();
  console.log(`[VectorQueue] Processing tasks (limit=${limit})...`);

  try {
    const result = await itemsService.processVectorSyncQueue(limit);
    console.log(`[VectorQueue] Processed ${result.processed} task(s).`);
  } catch (error) {
    console.error('[VectorQueue] Runner failed:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('[VectorQueue] Fatal error:', error);
  process.exit(1);
});
