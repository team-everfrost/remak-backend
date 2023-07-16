import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MemoDto } from './dto/request/memo.dto';
import { WebpageDto } from './dto/request/webpage.dto';
import { DocumentDto } from './dto/response/document.dto';

@Injectable()
export class DocumentService {
  private readonly logger: Logger = new Logger(DocumentService.name);
  private readonly s3Client: S3Client = new S3Client({
    region: this.configService.get<string>('AWS_REGION'),
    credentials:
      this.configService.get<string>('NODE_ENV') === 'development'
        ? {
            accessKeyId: this.configService.get<string>('AWS_S3_ACCESS_KEY'),
            secretAccessKey:
              this.configService.get<string>('AWS_S3_SECRET_KEY'),
          }
        : undefined,
  });

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async findByCursor(uid: string, cursor: Date, docId: string, take) {
    // cursor-based pagination with updatedAt. if cursor is same, then sort by docId (uuid)

    const documents = await this.prisma.document.findMany({
      where: {
        user: {
          uid,
        },
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
    this.logger.debug(documents);
    return documents.map((document) => new DocumentDto(document));
  }

  async findOne(uid: string, docId: string) {
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

  async createMemo(uid: string, memoDto: MemoDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with uid ${uid} not found`);
    }

    const document = await this.prisma.document.create({
      data: {
        ...memoDto,
        type: DocumentType.MEMO,
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

  async updateMemo(uid: string, docId: string, memoDto: MemoDto) {
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

  async createWebpage(uid: string, webPageDto: WebpageDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with uid ${uid} not found`);
    }

    const document = await this.prisma.document.create({
      data: {
        ...webPageDto,
        type: DocumentType.WEBPAGE,
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

  async updateWebpage(uid: string, docId: string, webPageDto: WebpageDto) {
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

  async deleteOne(uid: string, docId: string) {
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

    // TODO: delete s3 object

    await this.prisma.document.delete({
      where: {
        id: document.id,
      },
    });
  }

  async uploadFiles(uid: string, files: Express.Multer.File[]) {
    files.forEach((file) => {
      this.logger.debug(file.mimetype, file.originalname, file.size);
    });
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with uid ${uid} not found`);
    }

    const documents = await Promise.all(
      files.map(async (file) => {
        const document = await this.prisma.document.create({
          data: {
            type: DocumentType.FILE,
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

        // upload to s3
        // TODO: s3 upload 실패시 롤백
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
            Key: document.docId,
            Body: file.buffer,
            ContentType: file.mimetype,
            Metadata: {
              originalname: file.originalname,
            },
          }),
        );

        return new DocumentDto(document);
      }),
    );

    this.logger.debug(documents);

    return documents;
  }

  async downloadFile(uid: string, docId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with uid ${uid} not found`);
    }

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

    return await getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
        Key: document.docId,
      }),
      { expiresIn: 60 * 60 * 24 },
    );
  }
}
