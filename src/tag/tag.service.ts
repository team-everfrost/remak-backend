import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagService {
  constructor(private readonly prisma: PrismaService) {}

  async getTags(uid: string): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      where: { user: { uid } },
    });

    return tags.map((tag) => tag.name);
  }
}
