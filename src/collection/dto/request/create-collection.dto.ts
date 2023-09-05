import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({
    description: '컬렉션에 속한 문서의 uuid',
    required: false,
  })
  docIds?: string[];
}
