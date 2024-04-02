import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { AwsModule } from '../aws/aws.module';
import { OpenAiModule } from '../openai/open-ai.module';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

@Module({
  imports: [OpenAiModule, AwsModule, UserModule],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
