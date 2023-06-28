import { Role } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  name: string;

  @IsEnum(Role)
  role: Role;
}
