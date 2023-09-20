import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { GetUid } from '../decorators/get-uid.decorator';
import { DocumentService } from './document.service';
import { MemoDto } from './dto/request/memo.dto';
import { WebpageDto } from './dto/request/webpage.dto';
import { DocumentDto } from './dto/response/document.dto';

@Controller('document')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DocumentController {
  private readonly logger: Logger = new Logger(DocumentController.name);

  constructor(private readonly documentService: DocumentService) {}

  @Post('file')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 1024 * 1024 * 10 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  uploadFile(
    @GetUid() uid: string,
    @UploadedFiles()
    files: Express.Multer.File[],
  ): Promise<DocumentDto[]> {
    return this.documentService.uploadFiles(uid, files);
  }

  @Get('file/:docId')
  downloadFile(
    @GetUid() uid: string,
    @Param('docId') docId: string,
  ): Promise<string> {
    return this.documentService.downloadFile(uid, docId);
  }

  @Post('memo')
  createMemo(
    @GetUid() uid: string,
    @Body() memoDto: MemoDto,
  ): Promise<DocumentDto> {
    return this.documentService.createMemo(uid, memoDto);
  }

  @Patch('memo/:docId')
  updateMemo(
    @GetUid() uid: string,
    @Param('docId') docId: string,
    @Body() memoDto: MemoDto,
  ): Promise<DocumentDto> {
    return this.documentService.updateMemo(uid, docId, memoDto);
  }

  @Post('webpage')
  createWebpage(
    @GetUid() uid: string,
    @Body() webpageDto: WebpageDto,
  ): Promise<DocumentDto> {
    return this.documentService.createWebpage(uid, webpageDto);
  }

  @Patch('webpage/:docId')
  updateWebpage(
    @GetUid() uid: string,
    @Param('docId') docId: string,
    @Body() webpageDto: WebpageDto,
  ): Promise<DocumentDto> {
    return this.documentService.updateWebpage(uid, docId, webpageDto);
  }

  @Get()
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: Date,
    description:
      '이전에 받은 문서들 중 마지막 문서의 updatedAt. 이 값이 없으면 현재 시간으로.',
    example: '2021-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'doc-id',
    required: false,
    type: String,
    description:
      '이전에 받은 문서들 중 마지막 문서의 docId. 이 값이 없으면 가장 큰 UUID 값으로.',
    example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '한 번에 받을 문서의 개수. 최대 20개까지 가능. 기본값은 20.',
  })
  findAllWithCursor(
    @GetUid() uid: string,
    @Query('cursor') cursor?: Date,
    @Query(
      'doc-id',
      new DefaultValuePipe('ffffffff-ffff-ffff-ffff-ffffffffffff'),
    )
    docId?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<DocumentDto[]> {
    return this.documentService.findByCursor(uid, cursor, docId, limit);
  }

  @Get(':docId')
  findOne(
    @GetUid() uid: string,
    @Param('docId') docId: string,
  ): Promise<DocumentDto> {
    return this.documentService.findOne(uid, docId);
  }

  @Get('search/tag')
  @ApiQuery({
    name: 'tagName',
    required: true,
    type: String,
    description: '태그 이름',
    example: 'tag0',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: Date,
    description:
      '이전에 받은 문서들 중 마지막 문서의 updatedAt. 이 값이 없으면 현재 시간으로.',
    example: '2021-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'doc-id',
    required: false,
    type: String,
    description:
      '이전에 받은 문서들 중 마지막 문서의 docId. 이 값이 없으면 가장 큰 UUID 값으로.',
    example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '한 번에 받을 문서의 개수. 최대 20개까지 가능. 기본값은 20.',
  })
  findByTag(
    @GetUid() uid: string,
    @Query('tagName') tagName: string,
    @Query('cursor') cursor?: Date,
    @Query(
      'doc-id',
      new DefaultValuePipe('ffffffff-ffff-ffff-ffff-ffffffffffff'),
    )
    docId?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<DocumentDto[]> {
    return this.documentService.findByTag(uid, tagName, cursor, docId, limit);
  }

  @Get('search/collection')
  @ApiQuery({
    name: 'collectionName',
    required: true,
    type: String,
    description: '컬렉션 이름',
    example: 'collection0',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: Date,
    description:
      '이전에 받은 문서들 중 마지막 문서의 updatedAt. 이 값이 없으면 현재 시간으로.',
    example: '2021-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'doc-id',
    required: false,
    type: String,
    description:
      '이전에 받은 문서들 중 마지막 문서의 docId. 이 값이 없으면 가장 큰 UUID 값으로.',
    example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '한 번에 받을 문서의 개수. 최대 20개까지 가능. 기본값은 20.',
  })
  findByCollection(
    @GetUid() uid: string,
    @Query('collectionName') collectionName: string,
    @Query('cursor') cursor?: Date,
    @Query(
      'doc-id',
      new DefaultValuePipe('ffffffff-ffff-ffff-ffff-ffffffffffff'),
    )
    docId?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<DocumentDto[]> {
    return this.documentService.findByCollection(
      uid,
      collectionName,
      cursor,
      docId,
      limit,
    );
  }

  @Delete(':docId')
  deleteOne(
    @GetUid() uid: string,
    @Param('docId') docId: string,
  ): Promise<void> {
    return this.documentService.deleteOne(uid, docId);
  }

  @Get('search/embedding')
  @ApiQuery({
    name: 'query',
    required: true,
    type: String,
    description: '임베딩 검색할 쿼리',
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
  searchByEmbedding(
    @GetUid() uid: string,
    @Query('query') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<DocumentDto[]> {
    this.logger.debug(`query: ${query}`);
    return this.documentService.findByEmbedding(uid, query, limit, offset);
  }

  @Get('search/text')
  @ApiQuery({
    name: 'query',
    required: true,
    type: String,
    description: '텍스트 검색할 쿼리',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: Date,
    description:
      '이전에 받은 문서들 중 마지막 문서의 updatedAt. 이 값이 없으면 현재 시간으로.',
    example: '2021-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'doc-id',
    required: false,
    type: String,
    description:
      '이전에 받은 문서들 중 마지막 문서의 docId. 이 값이 없으면 가장 큰 UUID 값으로.',
    example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '한 번에 받을 문서의 개수. 최대 20개까지 가능. 기본값은 20.',
    example: 20,
  })
  searchByQuery(
    @GetUid() uid: string,
    @Query('query') query: string,
    @Query('cursor') cursor?: Date,
    @Query(
      'doc-id',
      new DefaultValuePipe('ffffffff-ffff-ffff-ffff-ffffffffffff'),
    )
    docId?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<DocumentDto[]> {
    return this.documentService.findByFullText(
      uid,
      query,
      cursor,
      docId,
      limit,
    );
  }
}
