import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './common/database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { DataModule } from './modules/data/data.module';
import { DetectionModule } from './modules/detection/detection.module';
import { AlertModule } from './modules/alert/alert.module';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 定时任务模块
    ScheduleModule.forRoot(),
    // 数据库模块
    DatabaseModule,
    // Redis模块
    RedisModule,
    // 数据采集模块
    DataModule,
    // 异常检测模块
    DetectionModule,
    // 预警模块
    AlertModule,
    // Agent工作流模块
    AgentModule,
    // 其他业务模块将在后续任务中添加
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
