import { LoggerService } from '@nestjs/common';

/**
 * 自定义日志服务
 * 提供结构化JSON格式的日志输出
 */
export class CustomLogger implements LoggerService {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  /**
   * 格式化日志消息为JSON格式
   */
  private formatMessage(
    level: string,
    message: any,
    context?: string,
    trace?: string,
  ): string {
    const logObject = {
      timestamp: new Date().toISOString(),
      level,
      context: context || this.context || 'Application',
      message: typeof message === 'object' ? JSON.stringify(message) : message,
      ...(trace && { trace }),
    };

    return JSON.stringify(logObject);
  }

  log(message: any, context?: string) {
    console.log(this.formatMessage('info', message, context));
  }

  error(message: any, trace?: string, context?: string) {
    console.error(this.formatMessage('error', message, context, trace));
  }

  warn(message: any, context?: string) {
    console.warn(this.formatMessage('warn', message, context));
  }

  debug(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  verbose(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('verbose', message, context));
    }
  }
}

/**
 * 创建日志服务实例
 */
export function createLogger(context?: string): CustomLogger {
  return new CustomLogger(context);
}
