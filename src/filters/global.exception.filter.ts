import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message || 'Internal Server Error';

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      Sentry.captureException(exception);
    }

    response.status(status).json({
      message: message,
      data: null,
    });
  }
}
