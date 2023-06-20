import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Tokens } from './types/tokens.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getTokens(user: User): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          email: user.email,
          role: user.role,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
          expiresIn: 60 * 20,
        },
      ),
      this.jwtService.signAsync(
        {
          email: user.email,
          role: user.role,
        },
        {
          secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: 60 * 60 * 24 * 7,
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }
  async signupLocal(signupDto: SignupDto): Promise<Tokens> {
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
        provider: 'LOCAL',
      },
    });

    this.logger.debug(
      `user created: ${JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() + 'n' : value,
      )}`,
    );

    const tokens = await this.getTokens(user);

    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });
    this.logger.debug(
      `user updated: ${JSON.stringify(updatedUser, (key, value) =>
        typeof value === 'bigint' ? value.toString() + 'n' : value,
      )}`,
    );

    return tokens;
  }
  loginLocal() {
    return 'This action logs in a user';
  }

  logout() {
    return 'This action logs out a user';
  }
  refreshTokens() {
    return "This action refreshes a user's tokens";
  }
}
