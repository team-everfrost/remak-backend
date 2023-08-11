import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GetUid } from '../decorators/get-uid.decorator';
import { TagDto } from './dto/response/tag.dto';

@Controller('tag')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '한 번에 받을 문서의 개수. 최대 20개까지 가능. 기본값은 20.',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: '몇 번째 문서부터 검색 결과에 포함할지. 기본값은 0.',
  })
  async getTags(
    @GetUid() uid: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<TagDto[]> {
    limit = limit > 20 ? 20 : limit;
    return await this.tagService.getTags(uid, limit, offset);
  }
}
