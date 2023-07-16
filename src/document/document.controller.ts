import {
  Body,
  Controller,
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

@Controller('document')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DocumentController {
  private readonly logger: Logger = new Logger(DocumentController.name);

  constructor(private readonly documentService: DocumentService) {}

  @Post('file/upload')
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
  ) {
    return this.documentService.uploadFiles(uid, files);
  }

  @Get('file/download/:docId')
  downloadFile(@GetUid() uid: string, @Param('docId') docId: string) {
    return this.documentService.downloadFile(uid, docId);
  }

  @Post('memo/create')
  createMemo(@GetUid() uid: string, @Body() memoDto: MemoDto) {
    return this.documentService.createMemo(uid, memoDto);
  }

  @Patch('memo/update/:docId')
  updateMemo(
    @GetUid() uid: string,
    @Param('docId') docId: string,
    @Body() memoDto: MemoDto,
  ) {
    return this.documentService.updateMemo(uid, docId, memoDto);
  }

  @Post('webpage/create')
  createWebpage(@GetUid() uid: string, @Body() webpageDto: WebpageDto) {
    return this.documentService.createWebpage(uid, webpageDto);
  }

  @Patch('webpage/update/:docId')
  updateWebpage(
    @GetUid() uid: string,
    @Param('docId') docId: string,
    @Body() webpageDto: WebpageDto,
  ) {
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
    example: 20,
  })
  findAllWithCursor(
    @GetUid() uid: string,
    @Query('cursor') cursor?: Date,
    @Query('doc-id') docId?: string,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    this.logger.debug(cursor);
    this.logger.debug(docId);
    cursor = cursor ? cursor : new Date();
    docId = docId ? docId : 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    limit = limit && limit <= 20 ? limit : 20;
    return this.documentService.findByCursor(uid, cursor, docId, limit);
  }

  @Get(':docId')
  findOne(@GetUid() uid: string, @Param('docId') docId: string) {
    return this.documentService.findOne(uid, docId);
  }

  @Delete(':docId')
  deleteOne(@GetUid() uid: string, @Param('docId') docId: string) {
    return this.documentService.deleteOne(uid, docId);
  }
}
