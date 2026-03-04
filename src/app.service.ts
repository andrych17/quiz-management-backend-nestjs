import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getPing() {
    return {
      status: 'ok',
      message: 'Service is ready',
      timestamp: new Date().toISOString(),
    };
  }
}
