import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: '회원가입 이메일',
    example: 'example@example.com',
  })
  email: string;

  @IsString()
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
  password: string;
}
