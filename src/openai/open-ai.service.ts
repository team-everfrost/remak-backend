import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionChunk } from 'openai/resources';
import { Stream } from 'openai/streaming';
import { darePrompt, systemPrompt } from './prompt';

@Injectable()
export class OpenAiService {
  private readonly openai: OpenAI;
  private logger = new Logger(OpenAiService.name);

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async chat(
    query: string,
    context: string,
  ): Promise<Stream<ChatCompletionChunk>> {
    try {
      return await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `context: ${context}`,
          },
          {
            role: 'system',
            content: darePrompt,
          },
          {
            role: 'user',
            content: `query: ${query}`,
          },
        ],
        model: 'gpt-5',
        stream: true,
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return result.data[0].embedding;
    } catch (error) {
      if (error.response) {
        this.logger.error(error.response.status); // e.g. 401
        this.logger.error(error.response.data.message); // e.g. The authentication token you passed was invalid...
        this.logger.error(error.response.data.code); // e.g. 'invalid_api_key'
        this.logger.error(error.response.data.type); // e.g. 'invalid_request_error'
      } else {
        this.logger.error(error);
      }
      throw error;
    }
  }
}
