import { Pool, PoolConfig } from 'pg';

/**
 * 数据库配置
 */
export const getDatabaseConfig = (): PoolConfig => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return {
    connectionString: databaseUrl,
    max: 20, // 最大连接数
    idleTimeoutMillis: 30000, // 空闲超时
    connectionTimeoutMillis: 2000, // 连接超时
  };
};

/**
 * 创建数据库连接池
 */
export const createDatabasePool = (): Pool => {
  const config = getDatabaseConfig();
  const pool = new Pool(config);

  // 监听错误事件
  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });

  // 监听连接事件
  pool.on('connect', () => {
    console.log('Database connection established');
  });

  return pool;
};
