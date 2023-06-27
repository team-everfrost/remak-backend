import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemoDto } from './dto/request/create-memo.dto';
import { DocumentDto } from './dto/response/document.dto';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  async findAll(uid: string): Promise<DocumentDto[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        user: {
          uid,
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return documents.map((document) => {
      const tags = document.tags.map((tagDocument) => tagDocument.tag.name);
      return new DocumentDto(document, tags);
    });
  }

  async findOne(uid: string, docId: string) {
    const document = await this.prisma.document.findUnique({
      where: {
        docId,
      },
      include: {
        user: true,
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

  async createMemo(uid: string, createMemoDto: CreateMemoDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
    });

    const document = await this.prisma.document.create({
      data: {
        ...createMemoDto,
        type: DocumentType.MEMO,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return new DocumentDto(document, []);
  }
}
