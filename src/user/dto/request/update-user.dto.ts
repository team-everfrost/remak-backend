import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @ApiProperty({
    description: '유저 이름',
    example: '김승일',
  })
  name: string;

  @IsEnum(Role)
  @ApiProperty({
    description: '유저 권한',
    example: Role.BASIC,
  })
  role: Role;
}
