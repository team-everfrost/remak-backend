import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagDto } from './dto/response/tag.dto';

@Injectable()
export class TagService {
  private readonly logger: Logger = new Logger(TagService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTags(uid: string, limit: number, offset: number): Promise<TagDto[]> {
    const tags = await this.prisma.tag.findMany({
      select: {
        name: true,
        _count: { select: { documents: true } },
      },
      where: { user: { uid } },
      orderBy: { documents: { _count: 'desc' } },
      take: limit,
      skip: offset,
    });

    this.logger.log(`getTags: ${JSON.stringify(tags)}`);

    return tags.map((tag) => ({
      name: tag.name,
      count: tag._count.documents,
    }));
  }
}
