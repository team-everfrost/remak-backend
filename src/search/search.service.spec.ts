import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiService } from '../openai/open-ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        UserService,
        {
          provide: OpenAiService,
          useValue: {},
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'OPENSEARCH_NODE':
                  return 'http://localhost:9200';
                case 'OPENSEARCH_INDEX':
                  return 'index';
                case 'AWS_REGION':
                  return 'ap-northeast-2';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
