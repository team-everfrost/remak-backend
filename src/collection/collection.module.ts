import { Module } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CollectionController } from './collection.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [CollectionController],
  providers: [CollectionService],
})
export class CollectionModule {}
