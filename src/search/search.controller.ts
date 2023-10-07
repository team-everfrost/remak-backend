import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { GetUid } from '../decorators/get-uid.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { DocumentDto } from '../document/dto/response/document.dto';

@Controller('search')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('text/:query')
  async searchByText(
    @GetUid() uid: string,
    @Param('query') query: string,
  ): Promise<DocumentDto[]> {
    return this.searchService.searchByText(uid, query);
  }

  @Get('vector/:query')
  async searchByVector(
    @GetUid() uid: string,
    @Param('query') query: string,
  ): Promise<DocumentDto[]> {
    return this.searchService.searchByVector(uid, query);
  }

  @Get('hybrid/:query')
  async searchByHybrid(
    @GetUid() uid: string,
    @Param('query') query: string,
  ): Promise<DocumentDto[]> {
    return this.searchService.searchByHybrid(uid, query);
  }
}
