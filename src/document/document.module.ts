import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { OpenAiModule } from '../openai/open-ai.module';

@Module({
  imports: [OpenAiModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
