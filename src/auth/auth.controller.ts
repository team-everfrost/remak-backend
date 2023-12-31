import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { GetUid } from '../decorators/get-uid.decorator';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/request/auth.dto';
import { EmailDto } from './dto/request/email.dto';
import { VerifyCodeDto } from './dto/request/verify-code.dto';
import { Token } from './dto/response/token.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/local/login')
  @HttpCode(HttpStatus.OK)
  loginLocal(@Body() authDto: AuthDto): Promise<Token> {
    return this.authService.loginLocal(authDto);
  }

  @Post('/local/logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  logout(): Promise<void> {
    return this.authService.logout();
  }

  @Post('/signup-code')
  @HttpCode(HttpStatus.OK)
  sendSignupCode(@Body() emailDto: EmailDto): Promise<void> {
    return this.authService.sendSignupCode(emailDto);
  }

  @Post('/verify-code')
  @HttpCode(HttpStatus.OK)
  verifySignupCode(@Body() verifyCodeDto: VerifyCodeDto): Promise<void> {
    return this.authService.verifySignupCode(verifyCodeDto);
  }

  @Post('/local/signup')
  @HttpCode(HttpStatus.CREATED)
  signupLocal(@Body() authDto: AuthDto): Promise<Token> {
    return this.authService.signupLocal(authDto);
  }

  @Post('/reset-code')
  @HttpCode(HttpStatus.OK)
  sendResetCode(@Body() emailDto: EmailDto): Promise<void> {
    return this.authService.sendResetCode(emailDto);
  }

  @Post('/verify-reset-code')
  @HttpCode(HttpStatus.OK)
  verifyResetCode(@Body() verifyCodeDto: VerifyCodeDto): Promise<void> {
    return this.authService.verifyResetCode(verifyCodeDto);
  }

  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() authDto: AuthDto): Promise<void> {
    return this.authService.resetPassword(authDto);
  }

  @Post('/withdraw-code')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  sendWithdrawCode(@GetUid() uid: string): Promise<void> {
    return this.authService.sendWithdrawCode(uid);
  }

  @Post('/verify-withdraw-code')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          example: '123456',
        },
      },
    },
  })
  verifyWithdrawCode(
    @GetUid() uid: string,
    @Body()
    verifyCode: { code: string },
  ): Promise<void> {
    return this.authService.verifyWithdrawCode(uid, verifyCode.code);
  }

  @Post('/withdraw')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  withdraw(@GetUid() uid: string): Promise<void> {
    return this.authService.withdraw(uid);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/check-email')
  @HttpCode(HttpStatus.OK)
  checkEmail(@Body() emailDto: EmailDto): Promise<void> {
    return this.authService.checkEmail(emailDto);
  }
}
