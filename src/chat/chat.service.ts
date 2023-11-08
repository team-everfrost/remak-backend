import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/open-ai.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly searchService: SearchService,
  ) {}

  async rag(uid: string, query: string) {
    const relavantDocuments = await this.searchService.searchByVector(
      uid,
      query,
      5,
      0,
    );
    // content and query size 조절
    const document = relavantDocuments[0];
    const content = `title: ${document.title}\ncontent: ${document.content}`;
    console.log(`content: ${content}`);
    return this.openAiService.chat(query, content);
  }
}
