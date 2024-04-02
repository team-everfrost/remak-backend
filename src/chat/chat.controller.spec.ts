import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { OpenAiService } from '../openai/open-ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DocumentService } from '../document/document.service';
import { AwsService } from '../aws/aws.service';

describe('ChatController', () => {
  let controller: ChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 1000,
            limit: 30,
          },
        ]),
      ],
      controllers: [ChatController],
      providers: [
        ChatService,
        OpenAiService,
        DocumentService,
        AwsService,
        ConfigService,
        PrismaService,
        UserService,
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
