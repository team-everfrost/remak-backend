import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { Tokens } from './types/tokens.type';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/local/signup')
  @HttpCode(HttpStatus.CREATED)
  signupLocal(@Body() signupDto: SignupDto): Promise<Tokens> {
    return this.authService.signupLocal(signupDto);
  }

  @Post('/local/login')
  @HttpCode(HttpStatus.OK)
  loginLocal(@Body() authDto: AuthDto): Promise<Tokens> {
    return this.authService.loginLocal(authDto);
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return this.authService.logout();
  }

  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  refresh() {
    return this.authService.refreshTokens();
  }
}
