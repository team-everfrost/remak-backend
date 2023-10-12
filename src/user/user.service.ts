import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { UserDto } from './dto/response/user.dto';

@Injectable()
export class UserService {
  private readonly basicUserFileStorageSize = 1024 * 1024 * 1024 * 1; // 1GB
  private readonly plusUserFileStorageSize = 1024 * 1024 * 1024 * 10; // 10GB
  private readonly logger: Logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOne(uid: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { uid },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return new UserDto(user);
  }

  async findByUid(uid: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { uid },
    });

    if (!user) {
      throw new NotFoundException(`User with uid ${uid} not found`);
    }

    return user;
  }

  async update(uid: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const user = await this.prisma.user.update({
      where: { uid },
      data: updateUserDto,
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return new UserDto(user);
  }

  async getTotalFileSize(uid: string): Promise<bigint> {
    const user = await this.prisma.user.findUnique({
      where: { uid },
    });

    if (!user) {
      throw new NotFoundException(`User with uid ${uid} not found`);
    }

    const documentFileSizeSummation = await this.prisma.document.aggregate({
      where: { userId: user.id },
      _sum: { fileSize: true },
    });

    this.logger.log(
      `user ${uid} total file size: ${documentFileSizeSummation}`,
    );

    return documentFileSizeSummation._sum.fileSize;
  }

  async checkUploadAvailable(uid: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { uid },
    });

    if (!user) {
      throw new NotFoundException(`User with uid ${uid} not found`);
    }

    const totalFileSize = await this.getTotalFileSize(uid);

    switch (user.role) {
      case 'BASIC':
        return totalFileSize < this.basicUserFileStorageSize;
      case 'PLUS':
        return totalFileSize < this.plusUserFileStorageSize;
      case 'ADMIN':
        return true;
      default:
        throw new Error(`Invalid role: ${user.role}`);
    }
  }
}
