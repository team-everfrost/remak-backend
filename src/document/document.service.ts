import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemoDto } from './dto/create-memo.dto';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  // create(createDocumentDto: CreateDocumentDto) {
  //   return 'This action adds a new document';
  // }

  async findAll(uid: string) {
    return this.prisma.document.findMany({
      where: {
        user: {
          uid,
        },
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} document`;
  }

  // update(id: number, updateDocumentDto: UpdateDocumentDto) {
  //   return `This action updates a #${id} document`;
  // }

  remove(id: number) {
    return `This action removes a #${id} document`;
  }

  createMemo(uid: string, createMemoDto: CreateMemoDto) {
    return `This action adds a new memo ${createMemoDto} for user ${uid}`;
  }

  updateMemo(id: number, updateMemoDto: CreateMemoDto) {
    return `This action updates a memo ${updateMemoDto} #${id}`;
  }
}
