import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    const path = req.originalUrl.split('?')[0];

    res.on('close', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      const status = res.writableFinished ? res.statusCode : 'aborted';
      this.logger.log(
        `${req.method} ${path} ${status} ${durationMs.toFixed(1)}ms`,
      );
    });

    next();
  }
}
