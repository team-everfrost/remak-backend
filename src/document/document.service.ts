import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentType, Prisma, Status, Tag } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { AwsService } from '../aws/aws.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { MemoDto } from './dto/request/memo.dto';
import { WebpageDto } from './dto/request/webpage.dto';
import { DocumentDto } from './dto/response/document.dto';
import { OpenAiService } from '../openai/open-ai.service';

@Injectable()
export class DocumentService {
  private readonly logger: Logger = new Logger(DocumentService.name);

  constructor(
    private prisma: PrismaService,
    private awsService: AwsService,
    private userService: UserService,
    private configService: ConfigService,
    private openAiService: OpenAiService,
  ) {}

  async findByCursor(
    uid: string,
    cursor: Date,
    docId: string,
    take: number,
  ): Promise<DocumentDto[]> {
    cursor = cursor || new Date();
    take = Math.min(take, 20);
    const user = await this.userService.findByUid(uid);

    // cursor-based pagination with updatedAt. if cursor is same, then sort by docId (uuid)
    const documents = await this.prisma.document.findMany({
      where: {
        userId: user.id,
        OR: [
          { updatedAt: { lt: cursor } },
          {
            updatedAt: cursor,
            docId: { lt: docId },
          },
        ],
      },
      include: { tags: true },
      orderBy: [{ updatedAt: 'desc' }],
      take,
    });
    return documents.map((document) => new DocumentDto(document));
  }

  async findByText(
    uid: string,
    query: string,
    cursor: Date,
    docId: string,
    take: number,
  ): Promise<DocumentDto[]> {
    cursor = cursor ? cursor : new Date();
    take = take > 20 ? 20 : take;

    const user = await this.userService.findByUid(uid);
    const documents = await this.prisma.document.findMany({
      where: {
        AND: [
          { userId: user.id },
          {
            OR: [
              { updatedAt: { lt: cursor } },
              {
                updatedAt: cursor,
                docId: { lt: docId },
              },
            ],
          },
          {
            OR: [
              { title: { contains: query } },
              { content: { contains: query } },
            ],
          },
        ],
      },
      include: { tags: true },
      orderBy: [{ updatedAt: 'desc' }],
      take,
    });

    return documents.map((document) => new DocumentDto(document));
  }

  async findByEmbedding(
    uid: string,
    query: string,
    limit: number,
    offset: number,
  ): Promise<DocumentDto[]> {
    const user = await this.userService.findByUid(uid);
    const vector = await this.getVectorFromQuery(query);

    const items: any[] = await this.fetchDocumentsWithVector(
      user.id,
      vector,
      limit,
      offset,
    );

    return items.map((item) => ({
      docId: item.doc_id,
      title: item.title,
      type: item.type,
      url: item.url,
      content: item.content,
      summary: item.summary,
      status: item.status,
      thumbnailUrl: item.thumbnail_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      tags: item.tags,
    }));
  }

  async findByTextAndEmbedding(
    uid: string,
    query: string,
  ): Promise<DocumentDto[]> {
    await this.userService.findByUid(uid);
    const textDocuments = await this.findByText(
      uid,
      query,
      null,
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
      20,
    );
    const embeddingDocuments = await this.findByEmbedding(uid, query, 20, 0);

    // 중복된 문서 찾아서 배열로 만들기
    const duplicatedDocuments = textDocuments.filter((textDocument) =>
      embeddingDocuments.some(
        (embeddingDocument) => embeddingDocument.docId === textDocument.docId,
      ),
    );

    // Text 검색 결과에만 있는 문서 찾아서 배열로 만들기
    const textOnlyDocuments = textDocuments.filter(
      (textDocument) =>
        !embeddingDocuments.some(
          (embeddingDocument) => embeddingDocument.docId === textDocument.docId,
        ),
    );

    // Embedding 검색 결과에만 있는 문서 찾아서 배열로 만들기
    const embeddingOnlyDocuments = embeddingDocuments.filter(
      (embeddingDocument) =>
        !textDocuments.some(
          (textDocument) => textDocument.docId === embeddingDocument.docId,
        ),
    );

    // 세개 순서대로 합쳐서 반환
    return duplicatedDocuments.concat(
      textOnlyDocuments,
      embeddingOnlyDocuments,
    );
  }

  async findOne(uid: string, docId: string): Promise<DocumentDto> {
    const document = await this.prisma.document.findUnique({
      where: { docId, user: { uid } },
      include: {
        tags: true,
        user: true,
      },
    });

    if (!document) {
      throw new NotFoundException(
        `Document with docId ${docId} and uid ${uid} not found`,
      );
    }

    return new DocumentDto(document);
  }

  async createMemo(uid: string, memoDto: MemoDto): Promise<DocumentDto> {
    const user = await this.userService.findByUid(uid);

    const document = await this.prisma.document.create({
      data: {
        ...memoDto,
        type: DocumentType.MEMO,
        status: Status.EMBED_PENDING,
        user: { connect: { id: user.id } },
      },
      include: { tags: true },
    });

    await this.requestEmbed(document.id);

    return new DocumentDto(document);
  }

  async updateMemo(
    uid: string,
    docId: string,
    memoDto: MemoDto,
  ): Promise<DocumentDto> {
    const document = await this.prisma.document.findUnique({
      where: { docId },
      include: {
        tags: true,
        user: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with docId ${docId} not found`);
    }

    if (document.user.uid !== uid) {
      throw new UnauthorizedException(`Unauthorized`);
    }

    const updatedDocument = await this.prisma.document.update({
      where: { id: document.id },
      data: { ...memoDto, status: Status.EMBED_PENDING },
      include: { tags: true },
    });

    await this.requestEmbed(document.id);

    return new DocumentDto(updatedDocument);
  }

  async createWebpage(
    uid: string,
    webPageDto: WebpageDto,
  ): Promise<DocumentDto> {
    const user = await this.userService.findByUid(uid);

    const document = await this.prisma.document.create({
      data: {
        ...webPageDto,
        type: DocumentType.WEBPAGE,
        status: Status.SCRAPE_PENDING, // 웹페이지는 스크랩부터
        user: { connect: { id: user.id } },
      },
      include: { tags: true },
    });

    // 스크랩 요청
    await this.requestScrape(document.id);

    return new DocumentDto(document);
  }

  async updateWebpage(
    uid: string,
    docId: string,
    webPageDto: WebpageDto,
  ): Promise<DocumentDto> {
    const document = await this.prisma.document.findUnique({
      where: { docId },
      include: {
        tags: true,
        user: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with docId ${docId} not found`);
    }

    if (document.user.uid !== uid) {
      throw new UnauthorizedException(`Unauthorized`);
    }

    const updatedDocument = await this.prisma.document.update({
      where: { id: document.id },
      data: { ...webPageDto },
      include: { tags: true },
    });

    return new DocumentDto(updatedDocument);
  }

  async deleteOne(uid: string, docId: string): Promise<void> {
    const document = await this.prisma.document.findUnique({
      where: { docId },
      include: {
        user: true,
        tags: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with docId ${docId} not found`);
    }

    if (document.user.uid !== uid) {
      throw new UnauthorizedException(`Unauthorized`);
    }

    const tagIds = document.tags.map((tag) => tag.id);

    // 방금 지운 문서가 유일한 문서인 태그를 찾음
    const deleteTags: Tag[] = await this.getDeleteTags(tagIds);

    this.logger.log(`deleteTags: ${JSON.stringify(deleteTags)}`);

    try {
      await this.prisma.$transaction([
        this.prisma.document.delete({
          where: { id: document.id },
        }),

        // 방금 지운 문서가 유일한 문서인 태그는 삭제
        this.prisma.tag.deleteMany({
          where: { id: { in: deleteTags.map((tag) => tag.id) } },
        }),

        // 임베딩 결과 삭제
        this.prisma.embeddedText.deleteMany({
          where: { documentId: document.id },
        }),
      ]);

      // S3에서 파일 삭제
      await this.deleteAllObjectsInS3(document.docId);

      // 검색엔진에서 삭제
      // await this.searchService.deleteIndexedDocument(document.id);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to delete document');
    }
  }

  async uploadFiles(
    uid: string,
    files: Express.Multer.File[],
  ): Promise<DocumentDto[]> {
    const user = await this.userService.findByUid(uid);
    const documentDtos: DocumentDto[] = [];

    const userFileStorageSize = this.userService.getUserFileStorageSize(
      user.role,
    );

    for (const file of files) {
      // multer가 latin1로 인코딩해서 보내줌. utf8로 변환
      file.originalname = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );

      const base64filename = Buffer.from(file.originalname).toString('base64');
      const docId = uuid();

      try {
        const totalFileSize = await this.userService.getTotalFileSize(uid);
        const remainingStorageSize = userFileStorageSize - totalFileSize;

        if (remainingStorageSize < file.size) {
          this.logger.error(
            `Not enough storage. remaining: ${remainingStorageSize}, required: ${file.size}`,
          );
          throw new BadRequestException(`Not enough storage.`);
        }

        await this.awsService.putDocument(docId, file, base64filename);
        const documentType = this.getDocumentType(file.mimetype);
        const document = await this.prisma.document.create({
          data: {
            docId, // S3 object key
            type: documentType,
            // IMAGE 인 경우 썸네일 추가
            thumbnailUrl:
              documentType === DocumentType.IMAGE
                ? `${this.configService.get<string>('THUMBNAIL_URL')}/${docId}`
                : null,
            status: Status.EMBED_PENDING,
            user: { connect: { id: user.id } },
            title: file.originalname,
            fileSize: file.size,
          },
          include: { tags: true },
        });

        // 임베딩 요청
        await this.requestEmbed(document.id);

        documentDtos.push(new DocumentDto(document));
      } catch (error) {
        this.logger.error(error);
        throw error;
      }
    }
    return documentDtos;
  }

  async downloadFile(uid: string, docId: string): Promise<string> {
    const document = await this.prisma.document.findUnique({
      where: { docId },
      include: { user: true },
    });

    if (!document) {
      throw new NotFoundException(`Document with docId ${docId} not found`);
    }

    if (document.user.uid !== uid) {
      throw new UnauthorizedException(`Unauthorized`);
    }

    return await this.awsService.getDocuemntSignedUrl(docId);
  }

  async findByTag(
    uid: string,
    tagName: string,
    cursor: Date,
    docId: string,
    take: number,
  ): Promise<DocumentDto[]> {
    cursor = cursor || new Date();
    take = Math.min(take, 20);

    const user = await this.userService.findByUid(uid);

    const tag = await this.prisma.tag.findUnique({
      where: {
        name_userId: {
          name: tagName,
          userId: user.id,
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with name ${tagName} not found`);
    }

    const documents = await this.prisma.document.findMany({
      where: {
        AND: [
          {
            tags: { some: { id: tag.id } },
          },
          {
            OR: [
              { updatedAt: { lt: cursor } },
              {
                updatedAt: cursor,
                docId: { lt: docId },
              },
            ],
          },
        ],
      },
      include: { tags: true },
      orderBy: [{ updatedAt: 'desc' }],
      take,
    });

    return documents.map((document) => new DocumentDto(document));
  }

  async findByCollection(
    uid: string,
    collectionName: string,
    cursor: Date,
    docId: string,
    take: number,
  ): Promise<DocumentDto[]> {
    cursor = cursor || new Date();
    take = Math.min(take, 20);

    const user = await this.userService.findByUid(uid);

    const collection = await this.prisma.collection.findUnique({
      where: {
        name_userId: {
          name: collectionName,
          userId: user.id,
        },
      },
    });

    if (!collection) {
      throw new NotFoundException(`Tag with name ${collectionName} not found`);
    }

    const documents = await this.prisma.document.findMany({
      where: {
        AND: [
          {
            collections: { some: { id: collection.id } },
          },
          {
            OR: [
              { updatedAt: { lt: cursor } },
              {
                updatedAt: cursor,
                docId: { lt: docId },
              },
            ],
          },
        ],
      },
      include: { tags: true },
      orderBy: [{ updatedAt: 'desc' }],
      take,
    });

    return documents.map((document) => new DocumentDto(document));
  }

  async getVectorFromQuery(query: string): Promise<string> {
    // DB에 저장된 vector가 있는지 확인
    const item: { vector: string }[] = await this.prisma.$queryRaw`
        select vector::text
        from embedded_query
        where query = ${query}
    `;

    this.logger.debug(`item: ${JSON.stringify(item)}`);

    // DB에 저장된 vector가 없으면 OpenAI API로 vector를 생성
    if (item.length === 0) {
      const vector: number[] = await this.openAiService.getEmbedding(query);
      const vectorString = JSON.stringify(vector);
      this.logger.debug(`vector: ${vectorString}`);
      await this.prisma.$queryRaw`
          insert into embedded_query (query, vector)
          values (${query}, ${vector})
      `;
      return vectorString;
    }

    return item[0].vector;
  }

  private async fetchDocumentsWithVector(
    userId: bigint,
    vector: string,
    limit: number,
    offset: number,
  ): Promise<any[]> {
    return this.prisma.$queryRaw`
        select d.*, array_agg(t.name) as tags, subquery.min_distance as distance
        from document as d
                 join (select document_id, min(vector <#> ${vector}::vector) as min_distance
                       from embedded_text
                       where user_id = ${userId}
                       group by document_id) as subquery on d.id = subquery.document_id
                 left join "_DocumentToTag" as dt on d.id = dt."A"
                 left join tag as t on dt."B" = t.id
        group by d.id, distance
        order by distance
        limit ${limit} offset ${offset};
    `;
  }

  private async getDeleteTags(tagIds: bigint[]): Promise<Tag[]> {
    return tagIds.length === 0
      ? []
      : await this.prisma.$queryRaw`
                select t.*
                from tag as t
                         join "_DocumentToTag" as dt on t.id = dt."B"
                where dt."B" in (${Prisma.join(tagIds)})
                group by t.id
                having count(dt."A") = 1
      `;
  }

  private getDocumentType(mimetype: string): DocumentType {
    return mimetype.split('/')[0] === 'image'
      ? DocumentType.IMAGE
      : DocumentType.FILE;
  }

  private async requestEmbed(documentId: bigint): Promise<void> {
    await this.awsService.sendMessageToEmbedQueue(documentId);
  }

  private async requestScrape(documentId: bigint): Promise<void> {
    await this.awsService.sendMessageToScrapeQueue(documentId);
  }

  private async deleteAllObjectsInS3(docId: string): Promise<void> {
    await Promise.all([
      this.awsService.deleteDocument(docId),
      this.awsService.deleteThumbnail(docId),
      this.awsService.deleteWebpageImages(docId),
    ]);
  }
}
