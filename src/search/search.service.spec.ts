import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiService } from '../openai/open-ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { SearchService } from './search.service';

describe.skip('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        UserService,
        PrismaService,
        ConfigService,
        {
          provide: OpenAiService,
          useValue: {
            getEmbedding: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeRRFScores', () => {
    it('should compute scores correctly', () => {
      const vectorResultItems = [
        { _source: { document_id: 1 } },
        { _source: { document_id: 2 } },
      ];
      const textResultItems = [
        { _source: { document_id: 2 } },
        { _source: { document_id: 3 } },
      ];

      const result = service.computeRRFScores(
        vectorResultItems,
        textResultItems,
      );

      expect(result).toEqual({
        '1': 1 / 61,
        '2': 1 / 61 + 1 / 62,
        '3': 1 / 62,
      });
    });
  });
});
