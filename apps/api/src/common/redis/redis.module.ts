import { Module, Global } from '@nestjs/common';
import { createRedisClient } from './redis.config';

/**
 * Redis客户端提供者令牌
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Redis模块
 * 提供全局的Redis客户端
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async () => {
        return await createRedisClient();
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
