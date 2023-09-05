import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { OpenAiModule } from '../openai/open-ai.module';
import { AwsModule } from '../aws/aws.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [OpenAiModule, AwsModule, UserModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
