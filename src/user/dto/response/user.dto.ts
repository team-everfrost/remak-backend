import { ApiProperty } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';

export class UserDto {
  @ApiProperty({
    description: '유저 이름',
    example: '김승일',
  })
  name: string;

  @ApiProperty({
    description: '유저 이메일',
    example: 'example@gmail.com',
  })
  email: string;

  @ApiProperty({
    description: '유저 프로필 이미지 주소',
    example: 'https://example.com/image.png',
  })
  imageUrl: string;

  @ApiProperty({
    description: '유저 권한',
    example: Role.BASIC,
  })
  role: Role;

  constructor(user: User) {
    this.name = user.name;
    this.email = user.email;
    this.imageUrl = user.imageUrl;
    this.role = user.role;
  }
}
