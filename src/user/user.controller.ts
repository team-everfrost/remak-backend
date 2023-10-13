import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GetRole } from '../decorators/get-role.decorator';
import { GetUid } from '../decorators/get-uid.decorator';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { UserDto } from './dto/response/user.dto';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findOne(@GetUid() uid: string): Promise<UserDto> {
    return this.userService.findByUid(uid);
  }

  @Patch()
  update(
    @GetUid() uid: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    return this.userService.update(uid, updateUserDto);
  }

  @Get('storage/size')
  getStorageSize(@GetRole() role: Role): bigint {
    // TODO: Plan 업그레이드시 Access Token 재발급해야 정상적으로 작동
    return this.userService.getUserFileStorageSize(role);
  }

  @Get('storage/usage')
  getTotalFileSize(@GetUid() uid: string): Promise<bigint> {
    return this.userService.getTotalFileSize(uid);
  }
}
