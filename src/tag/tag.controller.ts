import { Controller, Get, UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetUid } from '../decorators/get-uid.decorator';

@Controller('tag')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async getTags(@GetUid() uid: string): Promise<string[]> {
    return await this.tagService.getTags(uid);
  }
}
