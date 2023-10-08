import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { DocumentDto } from '../document/dto/response/document.dto';
import { OpenAiService } from '../openai/open-ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

@Injectable()
export class SearchService {
  private readonly client: Client;
  private readonly logger: Logger = new Logger(SearchService.name);
  private readonly documentIndex: string;
  private readonly embeddingIndex: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly openAiService: OpenAiService,
    private readonly userService: UserService,
  ) {
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

    this.documentIndex = this.configService.get<string>(
      'OPENSEARCH_DOCUMENT_INDEX',
    );
    this.embeddingIndex = this.configService.get<string>(
      'OPENSEARCH_EMBEDDING_INDEX',
    );
  }

  async autoComplete(uid: string, query: string) {
    const user = await this.userService.findByUid(uid);
    const result = await this.client.search({
      index: this.documentIndex,
      body: {
        _source: ['title', 'document_id', 'user_id', 'document_type'],
        query: {
          bool: {
            must: [
              { match: { 'title.autocomplete': query } },
              { term: { user_id: user.id } },
            ],
          },
        },
      },
    });

    this.logger.debug(`result: ${JSON.stringify(result.body.hits.hits)}`);

    const documentIds = result.body.hits.hits.map(
      (hit) => hit._source.document_id,
    );

    const documents = await this.prisma.document.findMany({
      where: { id: { in: documentIds } },
      include: { tags: true },
    });

    // documentId 순서대로 정렬
    documents.sort((a, b) => {
      return documentIds.indexOf(a.id) - documentIds.indexOf(b.id);
    });

    return documents.map((document) => new DocumentDto(document));
  }

  async searchByText(uid: string, query: string): Promise<DocumentDto[]> {
    const user = await this.userService.findByUid(uid);
    const result = await this.textSearch(query, user.id);

    const documentIds = result.body.hits.hits.map(
      (hit) => hit._source.document_id,
    );
    const documents = await this.prisma.document.findMany({
      where: { id: { in: documentIds } },
      include: { tags: true },
    });

    // documentId 순서대로 정렬
    documents.sort((a, b) => {
      return documentIds.indexOf(a.id) - documentIds.indexOf(b.id);
    });

    return documents.map((document) => new DocumentDto(document));
  }

  async searchByVector(uid: string, query: string): Promise<DocumentDto[]> {
    const user = await this.userService.findByUid(uid);
    const queryVector = await this.openAiService.getEmbedding(query);

    const result = await this.vectorSearch(queryVector, user.id);

    const documentIds = result.body.hits.hits.map(
      (hit) => hit._source.document_id,
    );
    const documents = await this.prisma.document.findMany({
      where: { id: { in: documentIds } },
      include: { tags: true },
    });

    // documentId 순서대로 정렬
    documents.sort((a, b) => {
      return documentIds.indexOf(a.id) - documentIds.indexOf(b.id);
    });

    return documents.map((document) => new DocumentDto(document));
  }

  async searchByHybrid(uid: string, query: string) {
    const user = await this.userService.findByUid(uid);
    const queryVector = await this.openAiService.getEmbedding(query);

    const vectorResult = await this.vectorSearch(queryVector, user.id);
    const textResult = await this.textSearch(query, user.id);

    const scores = this.computeRRFScores(
      vectorResult.body.hits.hits,
      textResult.body.hits.hits,
    );

    const vectorDocumentIds: bigint[] = vectorResult.body.hits.hits.map(
      (hit) => hit._source.document_id,
    );
    const textDocumentIds: bigint[] = textResult.body.hits.hits.map(
      (hit) => hit._source.document_id,
    );

    const documentIds = [
      ...new Set([...vectorDocumentIds, ...textDocumentIds]),
    ];

    const documents = await this.prisma.document.findMany({
      where: { id: { in: documentIds } },
      include: { tags: true },
    });

    // sort by score in descending order
    documents.sort((a, b) => {
      return scores[b.id.toString()] - scores[a.id.toString()];
    });

    return documents.map((document) => new DocumentDto(document));
  }

  // document_id: score 형태로 반환
  computeRRFScores(
    vectorResultItems,
    textResultItems,
    k = 60,
  ): { [key: string]: number } {
    const scores = {};

    const updateScore = (document_id, rank) => {
      if (!scores[document_id]) scores[document_id] = 0;
      scores[document_id] += 1 / (k + rank);
    };

    vectorResultItems.forEach((item, index) => {
      updateScore(item._source.document_id.toString(), index + 1);
    });

    textResultItems.forEach((item, index) => {
      updateScore(item._source.document_id.toString(), index + 1);
    });

    return scores;
  }

  private async textSearch(query: string, userId: bigint) {
    return this.client.search({
      index: this.documentIndex,
      body: {
        _source: [
          'title',
          'content',
          'user_id',
          'document_id',
          'document_type',
        ],
        query: {
          bool: {
            must: [
              { multi_match: { query, fields: ['title', 'content'] } },
              { term: { user_id: userId } },
            ],
          },
        },
      },
    });
  }

  private async vectorSearch(queryVector: number[], userId: bigint) {
    return this.client.search({
      index: this.embeddingIndex,
      body: {
        _source: ['document_id', 'user_id', 'document_type'],
        query: {
          bool: {
            must: [
              { knn: { vector: { vector: queryVector, k: 50 } } },
              { term: { user_id: userId } },
            ],
          },
        },
      },
    });
  }
}
