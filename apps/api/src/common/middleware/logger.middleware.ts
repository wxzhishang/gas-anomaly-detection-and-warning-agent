import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * HTTP日志中间件
 * 记录所有API请求和响应
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    // 记录请求
    this.logger.log({
      type: 'request',
      method,
      url: originalUrl,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    // 监听响应完成事件
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;

      // 记录响应
      const logData = {
        type: 'response',
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      };

      // 根据状态码选择日志级别
      if (statusCode >= 500) {
        this.logger.error(logData);
      } else if (statusCode >= 400) {
        this.logger.warn(logData);
      } else {
        this.logger.log(logData);
      }
    });

    next();
  }
}
