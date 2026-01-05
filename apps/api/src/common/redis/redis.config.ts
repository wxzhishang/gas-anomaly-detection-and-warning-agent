import { createClient, RedisClientOptions, RedisClientType } from 'redis';

/**
 * Redis配置
 */
export const getRedisConfig = (): RedisClientOptions => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  return {
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis reconnection failed after 10 attempts');
          return new Error('Redis reconnection failed');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  };
};

/**
 * 创建Redis客户端
 */
export const createRedisClient = async (): Promise<RedisClientType> => {
  const config = getRedisConfig();
  const client = createClient(config);

  // 监听错误事件
  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  // 监听连接事件
  client.on('connect', () => {
    console.log('Redis connection established');
  });

  // 监听重连事件
  client.on('reconnecting', () => {
    console.log('Redis reconnecting...');
  });

  // 连接到Redis
  await client.connect();

  return client as RedisClientType;
};
