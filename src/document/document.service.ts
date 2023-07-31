import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DocumentType, Status } from '@prisma/client';
import { toSql } from 'pgvector/utils';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { MemoDto } from './dto/request/memo.dto';
import { WebpageDto } from './dto/request/webpage.dto';
import { DocumentDto } from './dto/response/document.dto';
import { OpenAiService } from '../openai/open-ai.service';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class DocumentService {
  private readonly logger: Logger = new Logger(DocumentService.name);

  constructor(
    private prisma: PrismaService,
    private openAiService: OpenAiService,
    private awsService: AwsService,
  ) {}

  async findByCursor(
    uid: string,
    cursor: Date,
    docId: string,
    take: number,
  ): Promise<DocumentDto[]> {
    const user = await this.getUserByUid(uid);

    // cursor-based pagination with updatedAt. if cursor is same, then sort by docId (uuid)
    const documents = await this.prisma.document.findMany({
      where: {
        userId: user.id,
        // updatedAt < cursor OR (updatedAt = cursor AND document.docId < docId)
        // updatedAt 인덱스 타게?
        OR: [
          {
            updatedAt: {
              lt: cursor,
            },
          },
          {
            updatedAt: cursor,
            docId: {
              lt: docId,
            },
          },
        ],
      },
      include: {
        tags: true,
      },
      orderBy: [
        {
          updatedAt: 'desc',
        },
      ],
      take,
    });
    return documents.map((document) => new DocumentDto(document));
  }

  async findOne(uid: string, docId: string): Promise<DocumentDto> {
    const document = await this.prisma.document.findUnique({
      where: {
        docId,
      },
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

    return new DocumentDto(document);
  }

  async queryVector(uid: string, query: string): Promise<DocumentDto[]> {
    const user = await this.getUserByUid(uid);
    const vec: number[] = await this.openAiService.getEmbedding(query);
    const vector: string = toSql(vec);

    const items: any = await this.prisma.$queryRaw`
        select document_id, min_distance
        from ( select document_id, min((vector <#> ${vector}::vector) * - 1) as min_distance
               from embedded_text
               where user_id = ${user.id}
               group by document_id ) as subquery
        order by min_distance
        limit 5;
    `;

    this.logger.debug(`items: ${JSON.stringify(items)}`);

    const documents = await this.prisma.document.findMany({
      where: {
        id: {
          in: items.map((item) => item.document_id),
        },
      },
      include: {
        tags: true,
      },
    });

    return documents.map((document) => new DocumentDto(document));
  }

  async createMemo(uid: string, memoDto: MemoDto): Promise<DocumentDto> {
    const user = await this.getUserByUid(uid);

    const document = await this.prisma.document.create({
      data: {
        ...memoDto,
        type: DocumentType.MEMO,
        status: Status.EMBED_PENDING,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        tags: true,
      },
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
      where: {
        docId,
      },
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
      where: {
        id: document.id,
      },
      data: {
        ...memoDto,
      },
      include: {
        tags: true,
      },
    });

    return new DocumentDto(updatedDocument);
  }

  async createWebpage(
    uid: string,
    webPageDto: WebpageDto,
  ): Promise<DocumentDto> {
    const user = await this.getUserByUid(uid);

    const document = await this.prisma.document.create({
      data: {
        ...webPageDto,
        type: DocumentType.WEBPAGE,
        status: Status.SCRAPE_PENDING, // 웹페이지는 스크랩부터
        user: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        tags: true,
      },
    });

    return new DocumentDto(document);
  }

  async updateWebpage(
    uid: string,
    docId: string,
    webPageDto: WebpageDto,
  ): Promise<DocumentDto> {
    const document = await this.prisma.document.findUnique({
      where: {
        docId,
      },
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
      where: {
        id: document.id,
      },
      data: {
        ...webPageDto,
      },
      include: {
        tags: true,
      },
    });

    return new DocumentDto(updatedDocument);
  }

  async deleteOne(uid: string, docId: string): Promise<void> {
    const document = await this.prisma.document.findUnique({
      where: {
        docId,
      },
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

    await this.awsService.deleteObjectFromS3(document.docId);
    await this.prisma.document.delete({
      where: {
        id: document.id,
      },
    });
  }

  async uploadFiles(
    uid: string,
    files: Express.Multer.File[],
  ): Promise<DocumentDto[]> {
    const user = await this.getUserByUid(uid);
    const documentDtos: DocumentDto[] = [];

    for (const file of files) {
      // multer가 latin1로 인코딩해서 보내줌. utf8로 변환
      file.originalname = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );

      const base64filename = Buffer.from(file.originalname).toString('base64');
      const docId = uuid();

      try {
        await this.awsService.putObjectToS3(docId, file, base64filename);
        const documentType = this.getDocumentType(file.mimetype);
        const document = await this.prisma.document.create({
          data: {
            docId, // S3 object key
            type: documentType,
            status: Status.EMBED_PENDING,
            user: {
              connect: {
                id: user.id,
              },
            },
            title: file.originalname,
          },
          include: {
            tags: true,
          },
        });
        documentDtos.push(new DocumentDto(document));
      } catch (error) {
        this.logger.error(error);
        throw new InternalServerErrorException('upload failed');
      }
    }
    return documentDtos;
  }

  async downloadFile(uid: string, docId: string): Promise<string> {
    const document = await this.prisma.document.findUnique({
      where: {
        docId,
      },
      include: {
        user: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with docId ${docId} not found`);
    }

    if (document.user.uid !== uid) {
      throw new UnauthorizedException(`Unauthorized`);
    }

    return await this.awsService.getSignedUrlFromS3(docId);
  }

  private getDocumentType(mimetype: string): DocumentType {
    return mimetype.split('/')[0] === 'image'
      ? DocumentType.IMAGE
      : DocumentType.FILE;
  }

  private async requestEmbed(documentId: bigint) {
    await this.awsService.sendMessageToEmbedQueue(documentId);
  }

  private async getUserByUid(uid: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with uid ${uid} not found`);
    }

    return user;
  }
}
