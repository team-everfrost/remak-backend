import { ApiProperty } from '@nestjs/swagger';

export class CollectionDto {
  @ApiProperty({
    description: '컬렉션 이름',
    example: '백엔드',
  })
  name: string;

  @ApiProperty({
    description: '컬렉션 설명',
    example: '백엔드 개발과 관련된 블로그 글 모음',
  })
  description: string;

  @ApiProperty({
    description: '컬렉션에 속한 문서의 개수',
    example: 1,
  })
  count: number;
}
