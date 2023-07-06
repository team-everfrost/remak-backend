import { MailerService } from '@nestjs-modules/mailer';
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
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/request/auth.dto';
import { EmailDto } from './dto/request/email.dto';
import { SignupDto } from './dto/request/signup.dto';
import { VerifyCodeDto } from './dto/request/verify-code.dto';
import { Token } from './dto/response/token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {}

  async signupLocal(signupDto: SignupDto): Promise<Token> {
    const { email, password } = signupDto;

    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('email already exists');
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

  logout() {
    // TODO: 액세스 토큰 블랙리스트 + 리프레시 토큰 삭제
    return 'This action logs out a user';
  }

  async deleteAll() {
    // TODO: 테스트용. 배포 시 삭제
    await this.prisma.user.deleteMany();
    await this.prisma.email.deleteMany();
  }

  async sendSignupCode(emailDto: EmailDto) {
    const { email } = emailDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) throw new ConflictException('email already exists');

    const signupCode = this.getSignupCode(3);
    this.logger.debug(`signupCode: ${signupCode}`);

    await this.mailerService.sendMail({
      to: email,
      subject: 'Remak 회원가입 코드',
      html: `<b>회원가입 코드는 ${signupCode} 입니다</b>`,
    });

    await this.prisma.email.upsert({
      where: { email },
      update: { signupCode },
      create: {
        email,
        signupCode,
      },
    });
  }

  async verifySignupCode(verifyCodeDto: VerifyCodeDto) {
    const { email, signupCode } = verifyCodeDto;

    const emailData = await this.prisma.email.findUnique({
      where: { email },
    });

    if (!emailData) throw new ForbiddenException('Access denied');
    if (emailData.signupCode !== signupCode)
      throw new ForbiddenException('Access denied');

    // 인증 성공. 이후 signupLocal() 호출
    this.logger.debug(`signupCode verified: ${email}`);
    await this.prisma.email.update({
      where: { email },
      data: { signupCode: '', verified: true },
    });
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
        expiresIn: 60 * 60 * 12,
      },
    );

    this.logger.debug(`${user.id}'s accessToken: ${accessToken}`);

    return { accessToken };
  }

  getSignupCode(bytes: number) {
    // bytes * 2 길이의 랜덤 문자열 생성
    return crypto.randomBytes(bytes).toString('hex');
  }
}
