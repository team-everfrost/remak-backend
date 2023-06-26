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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GetRole } from '../decorators/GetRole';
import { GetUid } from '../decorators/GetUid';
import { DocumentService } from './document.service';
import { CreateMemoDto } from './dto/create-memo.dto';

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
  findAll(@GetUid() uid: string, @GetRole() role: Role) {
    this.logger.debug(`uid: ${uid}, role: ${role}`);
    return this.documentService.findAll(uid);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(+id);
  }

  @Patch('memo/:id')
  updateMemo(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMemoDto: CreateMemoDto,
  ) {
    return this.documentService.updateMemo(id, updateMemoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentService.remove(+id);
  }
}
