import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentType, Status } from '@prisma/client';
import { v4 as uuid } from 'uuid';
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
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with uid ${uid} not found`);
    }

    const documentDtos: DocumentDto[] = [];

    for (const file of files) {
      // multer가 latin1로 인코딩해서 보내줌. utf8로 변환
      file.originalname = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );

      const base64filename = Buffer.from(file.originalname).toString('base64');
      const docId = uuid();

      try {
        const res = await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
            Key: docId,
            Body: file.buffer,
            ContentType: file.mimetype,
            Metadata: {
              // S3 Metadata에 한글 못써서 base64로 인코딩
              originalname: base64filename,
            },
          }),
        );
        // S3 upload 성공하면 DB에 저장
        // TODO: 실패 로직 추가

        const documentType = this.getDocumentType(file.mimetype);

        if (res.$metadata.httpStatusCode === 200) {
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
        }
      } catch (error) {
        this.logger.error(error);
        throw new InternalServerErrorException('upload failed');
      }
    }
    return documentDtos;
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

  getDocumentType(mimetype: string): DocumentType {
    const type = mimetype.split('/')[0];
    if (type === 'image') {
      return DocumentType.IMAGE;
    }
    return DocumentType.FILE;
  }
}
