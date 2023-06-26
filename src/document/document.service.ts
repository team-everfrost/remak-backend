import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  create(createDocumentDto: CreateDocumentDto) {
    return 'This action adds a new document';
  }

  async findAll(uid: string) {
    return this.prisma.document.findMany({
      where: {
        author: {
          uid,
        },
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} document`;
  }

  update(id: number, updateDocumentDto: UpdateDocumentDto) {
    return `This action updates a #${id} document`;
  }

  remove(id: number) {
    return `This action removes a #${id} document`;
  }
}
