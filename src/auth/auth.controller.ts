import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { Tokens } from './types/tokens.type';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/local/signup')
  signupLocal(@Body() signupDto: SignupDto): Promise<Tokens> {
    return this.authService.signupLocal(signupDto);
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
