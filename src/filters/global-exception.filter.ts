import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse, ResponseFactory, ValidationError } from '../interfaces/api-response.interface';

/**
 * Global Exception Filter
 * Standardizes all error responses to follow the common ApiResponse format
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: ValidationError[] = [];

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;

      // Handle validation errors
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        
        if (responseObj.message) {
          if (Array.isArray(responseObj.message)) {
            // Validation pipe errors
            errors = responseObj.message.map((msg: string) => ({
              field: this.extractFieldFromMessage(msg),
              message: msg,
            }));
            message = 'Validation failed';
          } else {
            message = responseObj.message;
          }
        }

        if (responseObj.error && responseObj.statusCode) {
          message = responseObj.message || message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      
      // Handle TypeORM errors
      if (exception.name === 'QueryFailedError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Database operation failed';
      }
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : exception,
    );

    // Create standardized error response
    const errorResponse: ApiResponse<null> = ResponseFactory.error(
      message,
      errors.length > 0 ? errors : undefined,
      status,
      request.url,
    );

    response.status(status).json(errorResponse);
  }

  private extractFieldFromMessage(message: string): string {
    // Extract field name from validation messages like "email must be an email"
    const fieldMatch = message.match(/^(\w+)\s/);
    return fieldMatch ? fieldMatch[1] : 'unknown';
  }
}