import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { EmailDto } from './dto/email.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { Token } from './types/token.type';

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

  @Post('/signup-code')
  sendSignupCode(@Body() emailDto: EmailDto) {
    return this.authService.sendSignupCode(emailDto);
  }

  @Post('/verify-code')
  verifySignupCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifySignupCode(verifyCodeDto);
  }
}
