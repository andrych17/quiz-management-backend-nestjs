import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiResponse,
  ResponseFactory,
} from '../interfaces/api-response.interface';
import { Request, Response } from 'express';

/**
 * Global Response Interceptor
 * Standardizes all API responses to follow the common ApiResponse format
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - startTime;

        // If the response is already in ApiResponse format, just add metadata
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'message' in data
        ) {
          return {
            ...data,
            path: request.url,
            timestamp: data.timestamp || new Date().toISOString(),
            metadata: {
              ...data.metadata,
              duration,
            },
          };
        }

        // Determine success message based on HTTP method and status
        const message = this.getDefaultMessage(
          request.method,
          response.statusCode,
        );

        // Handle different response types
        if (data && typeof data === 'object') {
          // Check if it's a paginated response (has items and pagination properties)
          if ('items' in data && 'pagination' in data) {
            return ResponseFactory.success(
              data,
              message,
              {
                pagination: data.pagination,
                total: data.pagination.totalItems,
                count: data.items.length,
                duration,
              },
              response.statusCode,
            );
          }

          // Check if it's an array (list response)
          if (Array.isArray(data)) {
            return ResponseFactory.success(
              data,
              message,
              {
                count: data.length,
                duration,
              },
              response.statusCode,
            );
          }
        }

        // Standard single object response
        return ResponseFactory.success(
          data,
          message,
          {
            duration,
          },
          response.statusCode,
        );
      }),
    );
  }

  private getDefaultMessage(method: string, statusCode: number): string {
    const methodMessages = {
      GET: 'Data retrieved successfully',
      POST: 'Resource created successfully',
      PUT: 'Resource updated successfully',
      PATCH: 'Resource updated successfully',
      DELETE: 'Resource deleted successfully',
    };

    const statusMessages = {
      200: 'Operation successful',
      201: 'Resource created successfully',
      202: 'Request accepted',
      204: 'Operation completed successfully',
    };

    return (
      statusMessages[statusCode] ||
      methodMessages[method] ||
      'Operation completed successfully'
    );
  }
}
