import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration, OpenAIApi } from 'openai';

@Injectable()
export class OpenAiService {
  private readonly openAiConfig: Configuration;
  private readonly openAi: OpenAIApi;
  private logger = new Logger(OpenAiService.name);

  constructor(private readonly configService: ConfigService) {
    this.openAiConfig = new Configuration({
      apiKey: configService.get<string>('OPENAI_API_KEY'),
    });
    this.openAi = new OpenAIApi(this.openAiConfig);
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.openAi.createEmbedding({
        model: 'text-embedding-ada-002',
        input: text,
      });
      return result.data.data[0].embedding;
    } catch (e) {
      if (e.response) {
        this.logger.error(e.response.status);
        this.logger.error(e.response.data);
      } else {
        this.logger.error(e);
      }
      throw e;
    }
  }
}
