import { Module } from '@nestjs/common';
import { OpenAiModule } from 'src/openai/open-ai.module';
import { SearchModule } from 'src/search/search.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [OpenAiModule, SearchModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
