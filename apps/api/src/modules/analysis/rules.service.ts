import { Injectable } from '@nestjs/common';
import { Anomaly } from '../../common/types/anomaly.types';
import { Rule, RuleMatchResult } from './analysis.types';

@Injectable()
export class RulesService {
  private rules: Rule[] = [
    {
      id: 'rule-001',
      priority: 1,
      condition: (anomalies: Anomaly[]) =>
        anomalies.some(
          (a) => a.metric === 'outletPressure' && a.zScore > 4,
        ),
      cause: '调压器膜片可能老化或损坏\n出口压力异常波动超过正常范围4倍标准差',
      recommendation: '1. 立即停止设备运行\n2. 检查膜片状态\n3. 更换老化或损坏的膜片\n4. 重新校准压力参数',
    },
    {
      id: 'rule-002',
      priority: 2,
      condition: (anomalies: Anomaly[]) =>
        anomalies.some((a) => a.metric === 'temperature' && a.value > 60),
      cause: '设备温度异常升高\n可能存在阀门卡滞或摩擦过大',
      recommendation: '1. 检查阀门润滑情况\n2. 清理阀门内部杂质\n3. 必要时更换阀门密封件\n4. 检查周围环境温度',
    },
    {
      id: 'rule-003',
      priority: 3,
      condition: (anomalies: Anomaly[]) =>
        anomalies.some((a) => a.metric === 'inletPressure' && a.zScore > 4),
      cause: '进口压力异常波动\n上游供气系统可能不稳定',
      recommendation: '1. 检查上游管道压力\n2. 联系供气单位确认供气状态\n3. 检查进口过滤器是否堵塞\n4. 记录压力波动数据供分析',
    },
    {
      id: 'rule-004',
      priority: 4,
      condition: (anomalies: Anomaly[]) =>
        anomalies.some((a) => a.metric === 'flowRate' && a.zScore > 4),
      cause: '流量异常波动\n可能原因：\n- 管道泄漏\n- 下游用气量突增\n- 流量计故障',
      recommendation: '1. 立即检查管道完整性\n2. 排查是否存在泄漏点\n3. 核实下游用气设备状态\n4. 校验流量计读数准确性',
    },
    {
      id: 'rule-005',
      priority: 5,
      condition: (anomalies: Anomaly[]) => {
        const outletAnomaly = anomalies.find(
          (a) => a.metric === 'outletPressure',
        );
        const tempAnomaly = anomalies.find((a) => a.metric === 'temperature');
        return !!(
          outletAnomaly &&
          tempAnomaly &&
          outletAnomaly.zScore > 3 &&
          tempAnomaly.zScore > 3
        );
      },
      cause: '出口压力和温度同时异常\n调压器核心部件可能存在严重故障\n这是高风险状况，需要立即处理',
      recommendation: '1. 立即停机，切断气源\n2. 通知专业维修人员\n3. 全面检修调压器核心部件\n4. 更换损坏的关键零部件\n5. 完成维修后进行全面测试',
    },
  ];

  /**
   * 匹配规则
   * 遍历规则库，返回第一个匹配的规则（按优先级排序）
   */
  matchRules(anomalies: Anomaly[]): RuleMatchResult | null {
    // 按优先级排序规则
    const sortedRules = [...this.rules].sort((a, b) => a.priority - b.priority);

    // 遍历规则，返回第一个匹配的
    for (const rule of sortedRules) {
      if (rule.condition(anomalies)) {
        return {
          ruleId: rule.id,
          cause: rule.cause,
          recommendation: rule.recommendation,
        };
      }
    }

    return null;
  }

  /**
   * 获取所有规则（用于测试和管理）
   */
  getRules(): Rule[] {
    return this.rules;
  }
}
