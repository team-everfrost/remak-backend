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

    const handler = context.getHandler();
    const ct = context.getClass();

    const handlerName = handler?.name;
    const controllerName = ct?.name;

    const transactionName = `${controllerName}.${handlerName}`;

    const span = Sentry.startTransaction({
      op: 'http',
      name: transactionName,
      data: {
        headers: request.headers,
        method: request.method,
        url: request.url,
        query: request.query,
        params: request.params,
        body: request.body,
      },
    });

    return next.handle().pipe(
      finalize(() => {
        span.finish();
      }),
    );
  }
}
