import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async signupLocal(signupDto: SignupDto) {
    const { email, password, name } = signupDto;

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        provider: 'LOCAL',
      },
    });
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
