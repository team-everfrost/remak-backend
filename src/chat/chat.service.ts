import { Injectable } from '@nestjs/common';
import { ChatCompletionChunk } from 'openai/resources';
import { Stream } from 'openai/streaming';
import { DocumentDto } from '../document/dto/response/document.dto';
import { OpenAiService } from '../openai/open-ai.service';
import { DocumentService } from '../document/document.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly documentService: DocumentService,
  ) {}

  async rag(
    uid: string,
    query: string,
  ): Promise<[Stream<ChatCompletionChunk>, DocumentDto[]]> {
    const result = await this.documentService.findByEmbedding(uid, query, 1, 0);
    // TODO: EmbeddedText의 content 참조하도록 변경

    const context: string = `
    title: ${result[0].title}
    content: ${result[0].content.length > 1000 ? result[0].content.slice(0, 1000) : result[0].content}
    `;

    return [await this.openAiService.chat(query, context), result];
  }
}
