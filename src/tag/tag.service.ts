import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagDto } from './dto/response/tag.dto';

@Injectable()
export class TagService {
  private readonly logger: Logger = new Logger(TagService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(uid: string, limit: number, offset: number): Promise<TagDto[]> {
    limit = limit > 20 ? 20 : limit;
    const tags = await this.prisma.tag.findMany({
      select: {
        name: true,
        _count: { select: { documents: true } },
      },
      where: { user: { uid } },
      orderBy: [{ documents: { _count: 'desc' } }, { name: 'asc' }],
      take: limit,
      skip: offset,
    });

    this.logger.log(`getTags: ${JSON.stringify(tags)}`);

    return tags.map((tag) => ({
      name: tag.name,
      count: tag._count.documents,
    }));
  }

  async findByQuery(
    uid: string,
    query: string,
    limit: number,
    offset: number,
  ): Promise<TagDto[]> {
    const tags = await this.prisma.tag.findMany({
      select: {
        name: true,
        _count: { select: { documents: true } },
      },
      where: {
        user: { uid },
        name: { contains: query, mode: 'insensitive' },
      },
      orderBy: [{ documents: { _count: 'desc' } }, { name: 'asc' }],
      take: limit,
      skip: offset,
    });

    return tags.map((tag) => ({
      name: tag.name,
      count: tag._count.documents,
    }));
  }
}
