import { Controller, UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('tag')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TagController {
  constructor(private readonly tagService: TagService) {}
}
