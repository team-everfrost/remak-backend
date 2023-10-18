import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GetUid } from '../decorators/get-uid.decorator';
import { DocumentDto } from '../document/dto/response/document.dto';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('autocomplete')
  async autoComplete(
    @GetUid() uid: string,
    @Query('query') query: string,
  ): Promise<DocumentDto[]> {
    return this.searchService.autoComplete(uid, query);
  }

  @Get('text')
  @ApiQuery({
    name: 'query',
    required: true,
    type: String,
    description: '검색어',
  })
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
  async searchByText(
    @GetUid() uid: string,
    @Query('query') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ): Promise<DocumentDto[]> {
    return this.searchService.searchByText(uid, query, limit, offset);
  }

  @Get('vector')
  @ApiQuery({
    name: 'query',
    required: true,
    type: String,
    description: '검색어',
  })
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
  async searchByVector(
    @GetUid() uid: string,
    @Query('query') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ): Promise<DocumentDto[]> {
    return this.searchService.searchByVector(uid, query, limit, offset);
  }

  @Get('hybrid')
  @ApiQuery({
    name: 'query',
    required: true,
    type: String,
    description: '검색어',
  })
  async searchByHybrid(
    @GetUid() uid: string,
    @Query('query') query: string,
  ): Promise<DocumentDto[]> {
    return this.searchService.searchByTextAndVector(uid, query);
  }
}
