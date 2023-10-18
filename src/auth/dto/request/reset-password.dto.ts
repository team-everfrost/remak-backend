import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: '이메일',
    example: 'example@example.com',
  })
  email: string;

  @IsNotEmpty()
  @ApiProperty({
    description: '비밀번호 재설정 코드',
    example: '123456',
  })
  resetCode: string;

  @IsNotEmpty()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{9,}$/, {
    message:
      'Password must be at least 9 characters long, contain at least one letter and one number',
  })
  @ApiProperty({
    description:
      '비밀번호는 최소 9자 이상, 최소 하나의 문자 및 하나의 숫자를 포함해야 합니다.',
    example: 'password123',
  })
  newPassword: string;
}
