import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CustomLogger } from './common/logger/logger.config';

async function bootstrap() {
  // 使用自定义日志服务
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger('Bootstrap'),
  });

  // 启用CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // 启用全局异常过滤器
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const logger = new CustomLogger('Application');
  logger.log(`API服务启动成功: http://localhost:${port}`);
  logger.log(`环境: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
