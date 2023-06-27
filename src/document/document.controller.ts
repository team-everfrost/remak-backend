import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetUid } from '../decorators/get-uid.decorator';
import { DocumentService } from './document.service';
import { CreateMemoDto } from './dto/request/create-memo.dto';

@Controller('document')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DocumentController {
  private readonly logger: Logger = new Logger(DocumentController.name);

  constructor(private readonly documentService: DocumentService) {}

  @Post('memo/create')
  createMemo(@GetUid() uid: string, @Body() createMemoDto: CreateMemoDto) {
    this.logger.debug(`uid: ${uid}`);
    return this.documentService.createMemo(uid, createMemoDto);
  }

  @Get()
  findAll(@GetUid() uid: string) {
    return this.documentService.findAll(uid);
  }

  @Get(':docId')
  findOne(@GetUid() uid: string, @Param('docId') docId: string) {
    return this.documentService.findOne(uid, docId);
  }
}
