import { ApiProperty } from '@nestjs/swagger';

export class Token {
  @ApiProperty({
    description: 'Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  })
  accessToken: string;
  // refreshToken: string;
  // TODO: 엑세스 토큰 기간 짧게 + 리프레시 토큰 레디스에 저장하도록 구현
}
