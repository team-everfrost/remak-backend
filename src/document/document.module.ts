import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

@Module({
  imports: [JwtModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
