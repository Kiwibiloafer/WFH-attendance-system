import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'wfh-attendance-api',
      timestamp: new Date().toISOString(),
    };
  }
}
