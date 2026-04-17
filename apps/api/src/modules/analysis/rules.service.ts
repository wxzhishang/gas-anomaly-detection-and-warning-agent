import { Injectable } from '@nestjs/common';
import { Anomaly } from '../../common/types/anomaly.types';
import { Rule, RuleMatchResult } from './analysis.types';

@Injectable()
export class RulesService {
  private rules: Rule[] = [
    // 优先级1：最严重的多指标组合 - 出口压力+温度（高Z-Score）
    {
      id: 'rule-005',
      priority: 1,
      condition: (anomalies: Anomaly[]) => {
        const outletAnomaly = anomalies.find(
          (a) => a.metric === 'outletPressure',
        );
        const tempAnomaly = anomalies.find((a) => a.metric === 'temperature');
        return !!(
          outletAnomaly &&
          tempAnomaly &&
          outletAnomaly.zScore > 5 &&
          tempAnomaly.zScore > 5
        );
      },
      cause: '出口压力和温度同时严重异常\n调压器核心部件可能存在严重故障\n这是高风险状况，需要立即处理',
      recommendation: '1. 立即停机，切断气源\n2. 通知专业维修人员\n3. 全面检修调压器核心部件\n4. 更换损坏的关键零部件\n5. 完成维修后进行全面测试',
    },
    // 优先级2：单一指标严重异常 - 出口压力极高Z-Score
    {
      id: 'rule-001',
      priority: 2,
      condition: (anomalies: Anomaly[]) =>
        anomalies.length === 1 &&
        anomalies.some(
          (a) => a.metric === 'outletPressure' && a.zScore > 6,
        ),
      cause: '出口压力严重异常\n调压器膜片可能老化或损坏',
      recommendation: '1. 立即停止设备运行\n2. 检查膜片状态\n3. 更换老化或损坏的膜片\n4. 重新校准压力参数',
    },
    // 优先级3：单一指标严重异常 - 温度极高
    {
      id: 'rule-002',
      priority: 3,
      condition: (anomalies: Anomaly[]) =>
        anomalies.length === 1 &&
        anomalies.some((a) => a.metric === 'temperature' && a.value > 70),
      cause: '设备温度严重异常升高\n可能存在阀门卡滞或摩擦过大',
      recommendation: '1. 立即停机检查\n2. 检查阀门润滑情况\n3. 清理阀门内部杂质\n4. 必要时更换阀门密封件',
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
