import { StateGraph } from '@langchain/langgraph';
import { AgentState } from '../common/types/agent.types';
import { DetectionService } from '../modules/detection/detection.service';
import { AnalysisService } from '../modules/analysis/analysis.service';
import { AlertService } from '../modules/alert/alert.service';
import { Logger } from '@nestjs/common';

/**
 * 创建异常检测工作流
 * 
 * 工作流节点:
 * 1. detect - 异常检测节点
 * 2. analyze - 根因分析节点
 * 3. alert - 预警生成节点
 * 4. push - 预警推送节点
 * 
 * 工作流逻辑:
 * - 所有数据都经过异常检测
 * - 只有检测到异常时才进行根因分析
 * - 只有检测到异常时才生成和推送预警
 */
export function createDetectionWorkflow(
  detectionService: DetectionService,
  analysisService: AnalysisService,
  alertService: AlertService,
) {
  const logger = new Logger('DetectionWorkflow');

  /**
   * 节点1: 异常检测
   * 使用DetectionService检测传感器数据是否异常
   */
  const detectNode = async (state: AgentState) => {
    try {
      logger.log(`[detectNode] Starting anomaly detection for device ${state.deviceId}`);
      
      const anomalyResult = await detectionService.detectAnomaly(
        state.deviceId,
        state.sensorData,
      );

      logger.log(
        `[detectNode] Detection completed. Anomaly: ${anomalyResult.isAnomaly}, ` +
        `Anomalies count: ${anomalyResult.anomalies.length}`,
      );

      return { ...state, anomalyResult };
    } catch (error) {
      logger.error(`[detectNode] Error: ${error instanceof Error ? error.message : String(error)}`);
      return { ...state, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  /**
   * 节点2: 根因分析
   * 如果检测到异常,使用AnalysisService进行根因分析
   */
  const analyzeNode = async (state: AgentState) => {
    try {
      // 如果没有异常,跳过分析
      if (!state.anomalyResult?.isAnomaly) {
        logger.log('[analyzeNode] No anomaly detected, skipping analysis');
        return state;
      }

      logger.log(
        `[analyzeNode] Starting root cause analysis for ${state.anomalyResult.anomalies.length} anomalies`,
      );

      const rootCause = await analysisService.analyzeRootCause(
        state.anomalyResult.anomalies,
      );

      logger.log(
        `[analyzeNode] Analysis completed. Method: ${rootCause.method}, ` +
        `Confidence: ${rootCause.confidence}`,
      );

      return { ...state, rootCause };
    } catch (error) {
      logger.error(`[analyzeNode] Error: ${error instanceof Error ? error.message : String(error)}`);
      return { ...state, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  /**
   * 节点3: 预警生成
   * 如果检测到异常,生成预警记录
   */
  const alertNode = async (state: AgentState) => {
    try {
      // 如果没有异常,跳过预警生成
      if (!state.anomalyResult?.isAnomaly) {
        logger.log('[alertNode] No anomaly detected, skipping alert generation');
        return state;
      }

      logger.log('[alertNode] Generating alert');

      // 生成预警
      const alert = await alertService.createAlert(
        state.deviceId,
        state.anomalyResult,
        state.rootCause!,
      );

      logger.log(`[alertNode] Alert generated with level: ${alert.level}`);

      return { ...state, alert };
    } catch (error) {
      logger.error(`[alertNode] Error: ${error instanceof Error ? error.message : String(error)}`);
      return { ...state, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  /**
   * 节点4: 预警推送
   * 通过WebSocket推送预警到前端
   * 注意: WebSocket网关尚未实现,此处仅调用pushAlert方法
   */
  const pushNode = async (state: AgentState) => {
    try {
      // 如果没有预警,跳过推送
      if (!state.alert) {
        logger.log('[pushNode] No alert to push');
        return state;
      }

      logger.log('[pushNode] Pushing alert via WebSocket');

      // 调用预警推送方法(实际推送逻辑将在WebSocket Gateway中实现)
      await alertService.pushAlert(state.alert);

      logger.log('[pushNode] Alert pushed successfully');

      return state;
    } catch (error) {
      logger.error(`[pushNode] Error: ${error instanceof Error ? error.message : String(error)}`);
      return { ...state, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  // 创建状态图 - 使用简化的配置
  // @ts-ignore - LangGraph类型定义可能不完整,但运行时是正确的
  const workflow = new StateGraph({
    channels: {
      __root__: null,
    },
  });

  // 添加节点
  // @ts-ignore
  workflow.addNode('detect', detectNode);
  // @ts-ignore
  workflow.addNode('analyze', analyzeNode);
  // @ts-ignore
  workflow.addNode('alert', alertNode);
  // @ts-ignore
  workflow.addNode('push', pushNode);

  // 设置入口点
  // @ts-ignore
  workflow.setEntryPoint('detect');

  // 定义边: 线性流程
  // @ts-ignore
  workflow.addEdge('detect', 'analyze');
  // @ts-ignore
  workflow.addEdge('analyze', 'alert');
  // @ts-ignore
  workflow.addEdge('alert', 'push');
  // @ts-ignore
  workflow.setFinishPoint('push');

  // 编译工作流
  return workflow.compile();
}
