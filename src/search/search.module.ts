import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { OpenAiModule } from '../openai/open-ai.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ConfigModule, OpenAiModule, UserModule],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
