import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { createDatabasePool } from './database.config';

/**
 * 数据库连接池提供者令牌
 */
export const DATABASE_POOL = 'DATABASE_POOL';

/**
 * 数据库模块
 * 提供全局的PostgreSQL连接池
 */
@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: (): Pool => {
        return createDatabasePool();
      },
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
