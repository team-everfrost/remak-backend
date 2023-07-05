import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class VerifyCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @ApiProperty({
    description: '6자리 랜덤 인증 코드',
    example: 'a1b2c3',
  })
  signupCode: string;
}
