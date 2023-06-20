import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/local/signup')
  signupLocal() {
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
