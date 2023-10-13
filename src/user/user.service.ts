import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { UserDto } from './dto/response/user.dto';

@Injectable()
export class UserService {
  private readonly basicUserFileStorageSize = BigInt(1024 * 1024 * 1024 * 1); // 1GB
  private readonly plusUserFileStorageSize = BigInt(1024 * 1024 * 1024 * 10); // 10GB
  private readonly adminUserFileStorageSize = BigInt(1024 * 1024 * 1024 * 1024); // 1TB

  private readonly logger: Logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    this.logger.debug(
      `user ${uid} total file size: ${JSON.stringify(
        documentFileSizeSummation,
      )}`,
    );

    // null인 경우 0 반환
    return documentFileSizeSummation._sum.fileSize ?? BigInt(0);
  }

  async checkUploadAvailable(uid: string): Promise<boolean> {
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

    const userFileStorageSize = this.getUserFileStorageSize(user.role);

    return documentFileSizeSummation._sum.fileSize < userFileStorageSize;
  }

  getUserFileStorageSize(role: Role): bigint {
    switch (role) {
      case Role.BASIC:
        return this.basicUserFileStorageSize;
      case Role.PLUS:
        return this.plusUserFileStorageSize;
      case Role.ADMIN:
        return this.adminUserFileStorageSize;
      default:
        throw new Error(`Invalid role: ${role}`);
    }
  }
}
