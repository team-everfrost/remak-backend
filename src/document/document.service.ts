import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MemoDto } from './dto/request/memo.dto';
import { WebpageDto } from './dto/request/webpage.dto';
import { DocumentDto } from './dto/response/document.dto';

@Injectable()
export class DocumentService {
  private readonly logger: Logger = new Logger(DocumentService.name);

  constructor(private prisma: PrismaService) {}

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

    await this.prisma.document.delete({
      where: {
        id: document.id,
      },
    });
  }
}
