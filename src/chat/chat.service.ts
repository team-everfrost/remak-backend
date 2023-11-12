import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/open-ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService,
  ) {}

  async rag(uid: string, query: string) {
    const vector = await this.searchService.getQueryVector(query);
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
    });

    const relavantDocuments =
      await this.searchService.vectorSearchWithoutCollapse(
        vector,
        user.id,
        5,
        0,
      );

    const context = relavantDocuments.body.hits.hits
      .filter((hit) => hit._source.content.length > 200)
      .map((hit) => {
        return `---\ntitle: ${hit._source.chapter}\ncontent: ${hit._source.content}\n`;
      })
      .reverse()
      .join('\n');

    console.log(`context: ${context}`);
    return this.openAiService.chat(query, context);
  }
}
