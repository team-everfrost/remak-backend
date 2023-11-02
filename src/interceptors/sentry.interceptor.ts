import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Observable, finalize } from 'rxjs';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const span = Sentry.startTransaction({
      op: 'http',
      name: request.url,
      data: {
        headers: request.headers,
        method: request.method,
        url: request.url,
      },
    });

    return next.handle().pipe(
      finalize(() => {
        span.finish();
      }),
    );
  }
}
