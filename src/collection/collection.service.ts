import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CollectionDto } from './dto/response/collection.dto';
import { UserService } from '../user/user.service';
import { CreateCollectionDto } from './dto/request/create-collection.dto';
import { UpdateCollectionDto } from './dto/request/update-collection.dto';
import { AddDocumentsDto } from './dto/request/add-documents.dto';

@Injectable()
export class CollectionService {
  private readonly logger: Logger = new Logger(CollectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async findAll(
    uid: string,
    limit: number,
    offset: number,
  ): Promise<CollectionDto[]> {
    limit = limit > 20 ? 20 : limit;
    const collections = await this.prisma.collection.findMany({
      include: {
        _count: { select: { documents: true } },
      },
      where: { user: { uid } },
      orderBy: [{ documents: { _count: 'desc' } }, { name: 'asc' }],
      take: limit,
      skip: offset,
    });

    this.logger.log(`getTags: ${JSON.stringify(collections)}`);

    return collections.map((collection) => ({
      name: collection.name,
      description: collection.description,
      count: collection._count.documents,
    }));
  }

  async create(
    uid: string,
    createCollectionDto: CreateCollectionDto,
  ): Promise<CollectionDto> {
    const user = await this.userService.findByUid(uid);

    const documents = await this.prisma.document.findMany({
      select: { id: true },
      where: {
        userId: user.id,
        docId: { in: createCollectionDto.docIds ?? [] },
      },
    });

    // TODO: CreateCollectionDto에 docIds가 너무 많을 경우 처리

    try {
      const collection = await this.prisma.collection.create({
        data: {
          name: createCollectionDto.name,
          description: createCollectionDto.description,
          user: { connect: { id: user.id } },
          documents: {
            connect: documents.map((doc) => ({ id: doc.id })),
          },
        },
      });

      return {
        name: collection.name,
        description: collection.description,
        count: documents.length,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        // "Unique constraint failed on the {constraint}" 에러
        throw new BadRequestException('Collection already exists');
      }
    }
  }

  async deleteOne(uid: string, name: string): Promise<void> {
    const user = await this.userService.findByUid(uid);
    const collection = await this.prisma.collection.findUnique({
      where: { name_userId: { userId: user.id, name } },
      include: { user: true },
    });

    if (!collection) {
      throw new BadRequestException('Collection does not exist');
    }

    if (collection.user.uid !== uid) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.prisma.collection.delete({ where: { id: collection.id } });
  }

  async findOne(uid: string, name: string): Promise<CollectionDto> {
    const user = await this.userService.findByUid(uid);
    const collection = await this.prisma.collection.findUnique({
      where: { name_userId: { userId: user.id, name } },
      include: { _count: { select: { documents: true } } },
    });

    if (!collection) {
      throw new BadRequestException('Collection does not exist');
    }

    return {
      name: collection.name,
      description: collection.description,
      count: collection._count.documents,
    };
  }

  async updateOne(
    uid: string,
    name: string,
    updateCollectionDto: UpdateCollectionDto,
  ): Promise<CollectionDto> {
    const user = await this.userService.findByUid(uid);
    const collection = await this.prisma.collection.findUnique({
      where: { name_userId: { userId: user.id, name } },
      include: { user: true, documents: true },
    });

    if (!collection) {
      throw new BadRequestException('Collection does not exist');
    }

    if (collection.user.id !== user.id) {
      throw new UnauthorizedException('Unauthorized');
    }

    const addedDocuments = await this.prisma.document.findMany({
      select: { id: true },
      where: {
        userId: user.id,
        docId: { in: updateCollectionDto.addedDocIds ?? [] },
      },
    });

    const removedDocuments = await this.prisma.document.findMany({
      select: { id: true },
      where: {
        userId: user.id,
        docId: { in: updateCollectionDto.removedDocIds ?? [] },
      },
    });

    const updateData: any = {};
    if (updateCollectionDto.newName) {
      updateData.name = updateCollectionDto.newName;
    }
    if (updateCollectionDto.description) {
      updateData.description = updateCollectionDto.description;
    }
    if (addedDocuments.length > 0) {
      updateData.documents = {
        connect: addedDocuments.map((doc) => ({ id: doc.id })),
      };
    }
    if (removedDocuments.length > 0) {
      updateData.documents = {
        disconnect: removedDocuments.map((doc) => ({ id: doc.id })),
      };
    }

    try {
      const updatedCollection = await this.prisma.collection.update({
        where: { id: collection.id },
        include: { _count: { select: { documents: true } } },
        data: { ...updateData },
      });

      return {
        name: updatedCollection.name,
        description: updatedCollection.description,
        count: updatedCollection._count.documents,
      };
    } catch (e) {
      if (e.code === 'P2002') {
        // "Unique constraint failed on the {constraint}" 에러
        throw new BadRequestException('Collection already exists');
      }
    }
  }

  async addDocuments(
    uid: string,
    name: string,
    addDocumentsDto: AddDocumentsDto,
  ): Promise<void> {
    const docIds = addDocumentsDto.docIds;
    const user = await this.userService.findByUid(uid);
    const collection = await this.prisma.collection.findUnique({
      where: { name_userId: { userId: user.id, name } },
    });

    if (!collection) {
      throw new BadRequestException('Collection does not exist');
    }

    const documents = await this.prisma.document.findMany({
      select: { id: true },
      where: {
        userId: user.id,
        docId: { in: docIds },
      },
    });

    await this.prisma.collection.update({
      where: { id: collection.id },
      data: {
        documents: {
          connect: documents.map((doc) => ({ id: doc.id })),
        },
      },
    });
  }
}
