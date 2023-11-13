import { Injectable } from '@nestjs/common';
import { ChatCompletionChunk } from 'openai/resources';
import { Stream } from 'openai/streaming';
import { DocumentDto } from '../document/dto/response/document.dto';
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

  async rag(
    uid: string,
    query: string,
  ): Promise<[Promise<Stream<ChatCompletionChunk>>, DocumentDto[]]> {
    const vector = await this.searchService.getQueryVector(query);
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
    });

    const retrievalResult =
      await this.searchService.vectorSearchWithoutCollapse(
        vector,
        user.id,
        5,
        0,
      );

    const context = retrievalResult.body.hits.hits
      .filter((hit) => hit._source.content.length > 200)
      .map((hit) => {
        return `---\ntitle: ${hit._source.chapter}\ncontent: ${hit._source.content}\n`;
      })
      .reverse()
      .join('\n');

    const documentIds = retrievalResult.body.hits.hits.map(
      (hit) => hit._source.document_id,
    );

    const documents = await this.prisma.document.findMany({
      where: { id: { in: documentIds } },
      include: {
        tags: true,
      },
    });

    const dtos = documents.map((document) => new DocumentDto(document));

    return [this.openAiService.chat(query, context), dtos];
  }
}
