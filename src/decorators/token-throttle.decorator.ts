import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { TokenThrottlerGuard } from '../guard/token-throttler.guard';

export const THROTTLE_TTL = 'THROTTLE_TTL';
export const THROTTLE_LIMIT = 'THROTTLE_LIMIT';

export function TokenThrottle(ttl: number, limit: number) {
  return applyDecorators(
    SetMetadata(THROTTLE_TTL, ttl),
    SetMetadata(THROTTLE_LIMIT, limit),
    UseGuards(TokenThrottlerGuard),
  );
}
