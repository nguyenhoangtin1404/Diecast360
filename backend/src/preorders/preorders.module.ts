import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { MembersModule } from '../members/members.module';
import { PreordersController } from './preorders.controller';
import { PreordersService } from './preorders.service';

@Module({
  imports: [PrismaModule, StorageModule, MembersModule],
  controllers: [PreordersController],
  providers: [PreordersService],
  exports: [PreordersService],
})
export class PreordersModule {}
