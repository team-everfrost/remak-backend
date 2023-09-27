import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class WebpageDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '웹페이지 제목',
    example: '네이버',
  })
  title: string;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  @ApiProperty({
    description: '웹페이지 주소',
    example: 'https://www.naver.com',
  })
  url: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '웹페이지 본문 내용',
  })
  content: string;
}
