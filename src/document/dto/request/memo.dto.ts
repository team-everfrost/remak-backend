import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MemoDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '메모 내용',
    example: '오늘은 날씨가 좋다.',
  })
  content: string;
}
