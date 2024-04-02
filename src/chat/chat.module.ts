import { Module } from '@nestjs/common';
import { OpenAiModule } from 'src/openai/open-ai.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [OpenAiModule, DocumentModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
