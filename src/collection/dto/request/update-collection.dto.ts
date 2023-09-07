import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCollectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

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
