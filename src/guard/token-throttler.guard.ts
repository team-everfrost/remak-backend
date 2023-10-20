import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { JwtPayload, verify } from 'jsonwebtoken';
import {
  THROTTLE_LIMIT,
  THROTTLE_TTL,
} from '../decorators/token-throttle.decorator';

@Injectable()
export class TokenThrottlerGuard extends ThrottlerGuard {
  private readonly JWT_ACCESS_TOKEN_SECRET;

  constructor(
    @InjectThrottlerOptions()
    protected readonly options: ThrottlerModuleOptions,
    @InjectThrottlerStorage()
    protected readonly storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(options, storageService, reflector);
    this.JWT_ACCESS_TOKEN_SECRET = this.configService.get<string>(
      'JWT_ACCESS_TOKEN_SECRET',
    );
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing.');
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Malformed authorization header.');
    }

    const token = parts[1];

    try {
      const jwtPayload = verify(
        token,
        this.JWT_ACCESS_TOKEN_SECRET,
      ) as JwtPayload;

      if (!jwtPayload || !jwtPayload.aud) {
        throw new UnauthorizedException(
          'Invalid token or missing audience claim.',
        );
      }

      return jwtPayload.aud as string;
    } catch (error) {
      throw new UnauthorizedException('Invalid token.');
    }
  }
  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: ThrottlerOptions,
  ): Promise<boolean> {
    // 데코레이터에서 설정한 limit, ttl 값 가져오기
    limit =
      this.reflector.get<number>(THROTTLE_LIMIT, context.getHandler()) ?? limit;
    ttl = this.reflector.get<number>(THROTTLE_TTL, context.getHandler()) ?? ttl;

    // Here we start to check the amount of requests being done against the ttl.
    const { req, res } = this.getRequestResponse(context);
    const ignoreUserAgents =
      throttler.ignoreUserAgents ?? this.commonOptions.ignoreUserAgents;
    // Return early if the current user agent should be ignored.
    if (Array.isArray(ignoreUserAgents)) {
      for (const pattern of ignoreUserAgents) {
        if (pattern.test(req.headers['user-agent'])) {
          return true;
        }
      }
    }
    const tracker = await this.getTracker(req);
    const key = this.generateKey(context, tracker, throttler.name);
    const { totalHits, timeToExpire } = await this.storageService.increment(
      key,
      ttl,
    );

    const getThrottlerSuffix = (name: string) =>
      name === 'default' ? '' : `-${name}`;

    // Throw an error when the user reached their limit.
    if (totalHits > limit) {
      res.header(
        `Retry-After${getThrottlerSuffix(throttler.name)}`,
        timeToExpire,
      );
      await this.throwThrottlingException(context, {
        limit,
        ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
      });
    }

    res.header(
      `${this.headerPrefix}-Limit${getThrottlerSuffix(throttler.name)}`,
      limit,
    );
    // We're about to add a record so we need to take that into account here.
    // Otherwise the header says we have a request left when there are none.
    res.header(
      `${this.headerPrefix}-Remaining${getThrottlerSuffix(throttler.name)}`,
      Math.max(0, limit - totalHits),
    );
    res.header(
      `${this.headerPrefix}-Reset${getThrottlerSuffix(throttler.name)}`,
      timeToExpire,
    );

    return true;
  }
}
