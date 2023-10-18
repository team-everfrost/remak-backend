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
import { AuthDto } from './dto/request/auth.dto';
import { EmailDto } from './dto/request/email.dto';
import { SignupDto } from './dto/request/signup.dto';
import { VerifyCodeDto } from './dto/request/verify-code.dto';
import { Token } from './dto/response/token.dto';
import { ResetPasswordDto } from './dto/request/reset-password.dto';

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
  logout(): Promise<void> {
    return this.authService.logout();
  }

  @Post('/signup-code')
  @HttpCode(HttpStatus.OK)
  sendSignupCode(@Body() emailDto: EmailDto): Promise<void> {
    return this.authService.sendSignupCode(emailDto);
  }

  @Post('/reset-password-code')
  @HttpCode(HttpStatus.OK)
  sendResetCode(@Body() emailDto: EmailDto): Promise<void> {
    return this.authService.sendResetCode(emailDto);
  }

  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('/verify-code')
  @HttpCode(HttpStatus.OK)
  verifySignupCode(@Body() verifyCodeDto: VerifyCodeDto): Promise<void> {
    return this.authService.verifySignupCode(verifyCodeDto);
  }

  @Post('/check-email')
  @HttpCode(HttpStatus.OK)
  checkEmail(@Body() emailDto: EmailDto): Promise<void> {
    return this.authService.checkEmail(emailDto);
  }
}
