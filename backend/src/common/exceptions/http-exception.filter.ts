import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode, HTTP_STATUS_MAP } from '../constants/error-codes';

// Export ErrorCode để các module khác có thể import
export { ErrorCode };

export class AppException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    message: string,
    public readonly details?: unknown[],
    statusCode?: number,
  ) {
    super(
      {
        ok: false,
        error: {
          code: errorCode,
          details: details || [],
        },
        message,
      },
      statusCode || HTTP_STATUS_MAP[errorCode] || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

interface ErrorResponse {
  ok: boolean;
  error: {
    code: string;
    details: unknown[] | string;
  };
  message: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      ok: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        details: [],
      },
      message: 'Internal server error',
    };

    if (exception instanceof AppException) {
      status = exception.getStatus();
      errorResponse = exception.getResponse() as ErrorResponse;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        errorResponse = {
          ok: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            details: [],
          },
          message: exceptionResponse,
        };
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        if (resp.message && Array.isArray(resp.message)) {
          errorResponse = {
            ok: false,
            error: {
              code: ErrorCode.VALIDATION_ERROR,
              details: resp.message,
            },
            message: 'Validation failed',
          };
        } else {
          errorResponse = {
            ok: false,
            error: {
              code: ErrorCode.VALIDATION_ERROR,
              details: [],
            },
            message: (resp.message as string) || 'Validation failed',
          };
        }
      }
    } else {
      this.logger.error(
        `Unexpected error: ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
        `${request.method} ${request.url}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}

