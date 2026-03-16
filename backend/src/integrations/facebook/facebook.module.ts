import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FacebookConfigService } from './facebook-config.service';
import { FacebookGraphService } from './facebook-graph.service';

@Module({
  imports: [ConfigModule],
  providers: [FacebookConfigService, FacebookGraphService],
  exports: [FacebookConfigService, FacebookGraphService],
})
export class FacebookModule {}
