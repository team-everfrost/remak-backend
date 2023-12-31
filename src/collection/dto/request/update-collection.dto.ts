import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCollectionDto {
  @IsOptional()
  @IsString()
  newName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({
    description: '컬렉션에 새로 추가할 문서의 uuid',
    required: false,
  })
  addedDocIds?: string[];

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({
    description: '컬렉션에서 제거할 문서의 uuid',
    required: false,
  })
  removedDocIds?: string[];
}
