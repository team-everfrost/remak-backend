import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { UserDto } from './dto/response/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(uid: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        uid,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return new UserDto(user);
  }

  async update(uid: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: {
        uid,
      },
      data: updateUserDto,
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return new UserDto(user);
  }
}