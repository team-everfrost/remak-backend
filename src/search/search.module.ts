import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [ConfigModule],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
