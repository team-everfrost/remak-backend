import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetUid } from '../decorators/get-uid.decorator';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findOne(@GetUid() uid: string) {
    return this.userService.findOne(uid);
  }

  @Patch()
  update(@GetUid() uid: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(uid, updateUserDto);
  }
}
