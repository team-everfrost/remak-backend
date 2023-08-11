import { ApiProperty } from '@nestjs/swagger';

export class TagDto {
  @ApiProperty({
    description: '태그 이름',
    example: '태그',
  })
  name: string;

  @ApiProperty({
    description: '태그가 붙은 문서 개수',
    example: 1,
  })
  count: number;
}
