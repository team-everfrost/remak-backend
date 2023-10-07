import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AwsModule } from '../aws/aws.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';

@Module({
  imports: [JwtModule.register({}), AwsModule],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy],
})
export class AuthModule {}
