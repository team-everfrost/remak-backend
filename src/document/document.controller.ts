import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
    description: 'cursor',
    example: '2021-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'doc-id',
    required: false,
    type: String,
    description: 'doc-id',
    example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  })
  findAllWithCursor(
    @GetUid() uid: string,
    @Query('cursor') cursor?: Date,
    @Query('doc-id') docId?: string,
  ) {
    this.logger.debug(cursor);
    this.logger.debug(docId);
    cursor = cursor ? cursor : new Date();
    docId = docId ? docId : 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    return this.documentService.findByCursor(uid, cursor, docId, 10);
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
