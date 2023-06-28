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

  async findAll(uid: string): Promise<DocumentDto[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        user: {
          uid,
        },
      },
      include: {
        tags: true,
      },
    });

    this.logger.debug(documents);

    return documents.map((document) => new DocumentDto(document));
  }

  async findOne(uid: string, docId: string) {
    const document = await this.getDocument(uid, docId);

    return new DocumentDto(document);
  }

  async createMemo(uid: string, memoDto: MemoDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
    });

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
    const document = await this.getDocument(uid, docId);

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
    const document = await this.getDocument(uid, docId);

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
    const document = await this.getDocument(uid, docId);

    await this.prisma.document.delete({
      where: {
        id: document.id,
      },
    });
  }

  private async getDocument(uid: string, docId: string) {
    const document = await this.prisma.document.findUnique({
      where: {
        docId,
      },
      include: {
        user: true,
        tags: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.user.uid !== uid) {
      throw new UnauthorizedException('User not authorized');
    }

    return document;
  }
}
