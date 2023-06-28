import { ApiProperty } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';

export class UserDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'example@gmail.com',
  })
  email: string;

  @ApiProperty({
    description: 'The image url of the user',
    example: 'https://example.com/image.png',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'The role of the user',
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
