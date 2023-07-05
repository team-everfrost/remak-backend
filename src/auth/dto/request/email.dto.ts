import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: '인증용 이메일',
    example: 'example@example.com',
  })
  email: string;
}
