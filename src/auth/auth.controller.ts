import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/local/signup')
  signupLocal(@Body() authDto: AuthDto) {
    return this.authService.signupLocal();
  }

  @Post('/local/login')
  loginLocal() {
    return this.authService.loginLocal();
  }

  @Post('/logout')
  logout() {
    return this.authService.logout();
  }

  @Post('/refresh')
  refresh() {
    return this.authService.refreshTokens();
  }
}
