import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const GetUid = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.user || !request.user.aud) {
      throw new UnauthorizedException('JWT token is missing or invalid.');
    }

    return request.user.aud;
  },
);
