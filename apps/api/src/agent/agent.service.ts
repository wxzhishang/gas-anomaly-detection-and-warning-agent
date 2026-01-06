import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DetectionService } from '../modules/detection/detection.service';
import { AnalysisService } from '../modules/analysis/analysis.service';
import { AlertService } from '../modules/alert/alert.service';
import { createDetectionWorkflow } from './workflow';
import { AgentState } from '../common/types/agent.types';
import { SensorData } from '../common/types/sensor-data.types';

/**
 * Agent服务
 * 封装LangGraph工作流,提供统一的异常检测和分析接口
 */
@Injectable()
export class AgentService implements OnModuleInit {
  private readonly logger = new Logger(AgentService.name);
  private workflow: any;

  constructor(
    private readonly detectionService: DetectionService,
    private readonly analysisService: AnalysisService,
    private readonly alertService: AlertService,
  ) {}

  /**
   * 模块初始化时创建工作流
   */
  onModuleInit() {
    this.logger.log('Initializing LangGraph workflow');
    this.workflow = createDetectionWorkflow(
      this.detectionService,
      this.analysisService,
      this.alertService,
    );
    this.logger.log('LangGraph workflow initialized successfully');
  }

  /**
   * 执行完整的异常检测工作流
   * 
   * @param deviceId 设备ID
   * @param sensorData 传感器数据
   * @returns 工作流执行结果
   */
  async executeDetectionWorkflow(
    deviceId: string,
    sensorData: SensorData,
  ): Promise<AgentState> {
    this.logger.log(`Executing detection workflow for device ${deviceId}`);

    const initialState: AgentState = {
      deviceId,
      sensorData,
    };

    try {
      // 执行工作流
      const result = await this.workflow.invoke(initialState);

      this.logger.log(
        `Workflow completed for device ${deviceId}. ` +
        `Anomaly: ${result.anomalyResult?.isAnomaly ?? false}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Workflow execution failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 流式执行工作流(用于调试和监控)
   * 
   * @param deviceId 设备ID
   * @param sensorData 传感器数据
   * @returns 工作流状态流
   */
  async *streamDetectionWorkflow(
    deviceId: string,
    sensorData: SensorData,
  ): AsyncGenerator<AgentState> {
    this.logger.log(`Streaming detection workflow for device ${deviceId}`);

    const initialState: AgentState = {
      deviceId,
      sensorData,
    };

    try {
      // 流式执行工作流
      const stream = await this.workflow.stream(initialState);

      for await (const state of stream) {
        this.logger.debug(`Workflow state update: ${JSON.stringify(state)}`);
        yield state;
      }

      this.logger.log(`Workflow stream completed for device ${deviceId}`);
    } catch (error) {
      this.logger.error(
        `Workflow stream failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
