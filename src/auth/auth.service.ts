import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { AwsService } from '../aws/aws.service';
import {
  RESET_EMAIL_BODY,
  RESET_EMAIL_SUBJECT,
  SIGNUP_EMAIL_BODY,
  SIGNUP_EMAIL_SUBJECT,
  WITHDRAW_EMAIL_BODY,
  WITHDRAW_EMAIL_SUBJECT,
} from '../aws/email.const';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/request/auth.dto';
import { EmailDto } from './dto/request/email.dto';
import { VerifyCodeDto } from './dto/request/verify-code.dto';
import { Token } from './dto/response/token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private awsService: AwsService,
  ) {}

  async loginLocal(authDto: AuthDto): Promise<Token> {
    const { email, password } = authDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new ForbiddenException('Access denied');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new ForbiddenException('Access denied');

    return await this.getToken(user);
  }

  async logout() {
    // TODO: 액세스 토큰 블랙리스트 + 리프레시 토큰 삭제
  }

  async sendSignupCode(emailDto: EmailDto): Promise<void> {
    const { email } = emailDto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    this.logger.log(`user: ${JSON.stringify(user)}` + `email: ${email}`);

    if (user) {
      throw new ConflictException('Email already exists');
    }

    // TODO: rate limit

    const signupCode = this.getRandomCode();
    this.logger.debug(`signupCode: ${signupCode}`);

    await this.awsService.sendEmail(
      email,
      signupCode,
      SIGNUP_EMAIL_SUBJECT,
      SIGNUP_EMAIL_BODY,
    );

    // TODO: change to redis
    await this.prisma.email.upsert({
      where: { email },
      update: { signupCode },
      create: {
        email,
        signupCode,
      },
    });
  }

  async verifySignupCode(verifyCodeDto: VerifyCodeDto): Promise<void> {
    const { email, code } = verifyCodeDto;

    const emailData = await this.prisma.email.findUnique({
      where: { email },
    });

    if (!emailData) {
      throw new NotFoundException('No such email');
    }

    if (emailData.signupCode !== code) {
      throw new ForbiddenException('Invalid signup code');
    }

    // 인증 성공. 이후 signupLocal() 호출
    this.logger.debug(`signupCode verified: ${email}`);
    await this.prisma.email.update({
      where: { email },
      data: { verified: true },
    });
  }

  async signupLocal(authDto: AuthDto): Promise<Token> {
    const { email, password } = authDto;

    const userData = await this.prisma.user.findUnique({ where: { email } });
    if (userData) {
      throw new ConflictException('Email already exists');
    }

    const emailData = await this.prisma.email.findUnique({ where: { email } });
    if (!emailData || !emailData.verified) {
      throw new ForbiddenException('Email not verified');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.BASIC,
      },
    });

    this.logger.debug(`user created: ${JSON.stringify(user)}`);

    return await this.getToken(user);
  }

  async sendResetCode(emailDto: EmailDto): Promise<void> {
    const { email } = emailDto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('No such user');
    }

    const emailData = await this.prisma.email.findUnique({ where: { email } });

    if (!emailData) {
      throw new NotFoundException('No such email');
    }

    const resetCode = this.getRandomCode();
    this.logger.debug(`resetCode: ${resetCode}`);
    await this.awsService.sendEmail(
      email,
      resetCode,
      RESET_EMAIL_SUBJECT,
      RESET_EMAIL_BODY,
    );

    await this.prisma.email.update({
      where: { email },
      data: { resetCode },
    });
  }

  async verifyResetCode(verifyCodeDto: VerifyCodeDto): Promise<void> {
    const { email, code } = verifyCodeDto;

    const emailData = await this.prisma.email.findUnique({
      where: { email },
    });

    if (!emailData) {
      throw new NotFoundException('No such email');
    }

    if (emailData.resetCode !== code) {
      throw new ForbiddenException('Invalid reset code');
    }

    // 인증 성공. 이후 resetPassword() 호출
    this.logger.debug(`resetCode verified: ${email}`);
    await this.prisma.email.update({
      where: { email },
      data: { resetVerified: true },
    });
  }

  async resetPassword(authDto: AuthDto): Promise<void> {
    const { email, password: newPassword } = authDto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('No such user');
    }

    const emailData = await this.prisma.email.findUnique({ where: { email } });

    if (!emailData) {
      throw new NotFoundException('No such email');
    }

    if (!emailData.resetVerified) {
      throw new ForbiddenException('Reset code not verified');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
      this.prisma.$transaction([
        this.prisma.user.update({
          where: { email },
          data: { password: hashedPassword },
        }),
        this.prisma.email.update({
          where: { email },
          data: { resetVerified: false, resetCode: null },
        }),
      ]);
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async checkEmail(emailDto: EmailDto) {
    const { email } = emailDto;

    const userEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!userEmail) {
      throw new ForbiddenException('No such email');
    }
  }

  async getToken(user: User): Promise<Token> {
    const accessToken = await this.jwtService.signAsync(
      {
        aud: user.uid,
        role: user.role,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        // TODO: 리프레시 토큰 구현 후 만료 시간 조정
        expiresIn: 60 * 60 * 24 * 7,
      },
    );

    this.logger.debug(`${user.id}'s accessToken: ${accessToken}`);

    return { accessToken };
  }

  getRandomCode(): string {
    return randomInt(10 ** 5, 10 ** 6).toString();
  }
}
