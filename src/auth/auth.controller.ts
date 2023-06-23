import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { Token } from './types/token.type';
import { AuthDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/local/signup')
  @HttpCode(HttpStatus.CREATED)
  signupLocal(@Body() signupDto: SignupDto): Promise<Token> {
    return this.authService.signupLocal(signupDto);
  }

  @Post('/local/login')
  @HttpCode(HttpStatus.OK)
  loginLocal(@Body() authDto: AuthDto): Promise<Token> {
    return this.authService.loginLocal(authDto);
  }

  @Post('/local/logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  logout() {
    return this.authService.logout();
  }
}
