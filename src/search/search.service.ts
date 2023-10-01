import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';
import { ConfigService } from '@nestjs/config';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { DocumentIndexDto } from './dto/document.index.dto';

@Injectable()
export class SearchService {
  private readonly client: Client;
  private readonly logger: Logger = new Logger(SearchService.name);
  private readonly index: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Client({
      ...AwsSigv4Signer({
        region: this.configService.get<string>('AWS_REGION'),
        service: 'es',
        getCredentials: () => {
          const credentialsProvider = defaultProvider();
          return credentialsProvider();
        },
      }),
      node: this.configService.get<string>('OPENSEARCH_NODE'), // OpenSearch domain URL
    });

    this.index = this.configService.get<string>('OPENSEARCH_INDEX');
  }

  async indexDocument(uid: string, body: DocumentIndexDto): Promise<any> {
    const res = await this.client.index({
      index: this.index,
      body,
    });
    this.logger.log(`Indexed ${JSON.stringify(body)} to OpenSearch`);
    return res;
  }
}
