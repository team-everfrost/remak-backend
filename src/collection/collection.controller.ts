import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GetUid } from '../decorators/get-uid.decorator';
import { CollectionService } from './collection.service';
import { AddDocumentsDto } from './dto/request/add-documents.dto';
import { CreateCollectionDto } from './dto/request/create-collection.dto';
import { UpdateCollectionDto } from './dto/request/update-collection.dto';
import { CollectionDto } from './dto/response/collection.dto';

@Controller('collection')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '한 번에 받을 컬렉션의 개수. 최대 20개까지 가능. 기본값은 20.',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: '몇 번째 컬렉션부터 검색 결과에 포함할지. 기본값은 0.',
  })
  getCollections(
    @GetUid() uid: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<CollectionDto[]> {
    return this.collectionService.findAll(uid, limit, offset);
  }

  @Post()
  createCollection(
    @GetUid() uid: string,
    @Body() createCollectionDto: CreateCollectionDto,
  ): Promise<CollectionDto> {
    return this.collectionService.create(uid, createCollectionDto);
  }

  @Post('add/:name')
  addDocuments(
    @GetUid() uid: string,
    @Param('name') name: string,
    @Body() addDocumentsDto: AddDocumentsDto,
  ) {
    return this.collectionService.addDocuments(uid, name, addDocumentsDto);
  }

  @Get(':name')
  findByName(
    @GetUid() uid: string,
    @Param('name') name: string,
  ): Promise<CollectionDto> {
    return this.collectionService.findOne(uid, name);
  }

  @Patch(':name')
  update(
    @GetUid() uid: string,
    @Param('name') name: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
  ): Promise<CollectionDto> {
    return this.collectionService.updateOne(uid, name, updateCollectionDto);
  }

  @Delete(':name')
  delete(@GetUid() uid: string, @Param('name') name: string): Promise<void> {
    return this.collectionService.deleteOne(uid, name);
  }
}
