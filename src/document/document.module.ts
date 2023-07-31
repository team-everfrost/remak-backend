import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { OpenAiModule } from '../openai/open-ai.module';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [OpenAiModule, AwsModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
