import { Body, Controller, Post } from '@nestjs/common';
import { SearchService } from './search.service';
import { DocumentIndexDto } from './dto/document.index.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('index')
  async indexDocument(@Body() body: DocumentIndexDto): Promise<any> {
    return this.searchService.indexDocument('afds', body);
  }
}
