import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { JwtService } from '@nestjs/jwt';
import { Provider, Role, User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Token } from './types/token.type';
import { AuthDto } from './dto/auth.dto';
import { EmailDto } from './dto/email.dto';
import { MailerService } from '@nestjs-modules/mailer';

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
    const { email, password, name } = signupDto;

    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        provider: Provider.LOCAL,
        role: Role.BASIC,
      },
    });

    this.logger.debug(
      `user created: ${JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() + 'n' : value,
      )}`,
    );

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

  async sendSignupCode(emailDto: EmailDto) {
    const { email } = emailDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) throw new ConflictException('email already exists');

    await this.mailerService.sendMail({
      to: email,
      subject: '회원가입 코드',
      html: '<b>회원가입 코드</b>',
    });

    await this.prisma.email.upsert({
      where: { email },
      update: { signupCode: '123456' },
      create: {
        email,
        signupCode: '123456',
      },
    });
  }

  async verifySignupCode(emailDto: EmailDto) {
    const { email, signupCode } = emailDto;

    const emailData = await this.prisma.email.findUnique({
      where: { email },
    });

    if (!emailData) throw new ForbiddenException('Access denied');
    if (emailData.signupCode !== signupCode)
      throw new ForbiddenException('Access denied');

    await this.prisma.email.update({
      where: { email },
      data: { signupCode: '', verified: true },
    });
  }

  async getToken(user: User): Promise<Token> {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id.toString(), // bigint to string
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
}
