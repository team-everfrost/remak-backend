import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';

@Module({
  imports: [UserModule],
  controllers: [CollectionController],
  providers: [CollectionService],
})
export class CollectionModule {}
