import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/request/auth.dto';
import { EmailDto } from './dto/request/email.dto';
import { SignupDto } from './dto/request/signup.dto';
import { VerifyCodeDto } from './dto/request/verify-code.dto';
import { Token } from './dto/response/token.dto';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private awsService: AwsService,
  ) {}

  async signupLocal(signupDto: SignupDto): Promise<Token> {
    const { email, password } = signupDto;

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

    // TODO: rate limit

    const signupCode = this.getSignupCode();
    this.logger.debug(`signupCode: ${signupCode}`);

    await this.awsService.sendSignupEmail(email, signupCode);
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
    const { email, signupCode } = verifyCodeDto;

    const emailData = await this.prisma.email.findUnique({
      where: { email },
    });

    if (!emailData) {
      throw new ForbiddenException('No such email');
    }

    if (emailData.signupCode !== signupCode) {
      throw new ForbiddenException('Invalid signup code');
    }

    // 인증 성공. 이후 signupLocal() 호출
    this.logger.debug(`signupCode verified: ${email}`);
    await this.prisma.email.update({
      where: { email },
      data: { verified: true },
    });
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

  getSignupCode(): string {
    return randomInt(10 ** 5, 10 ** 6).toString();
  }
}
