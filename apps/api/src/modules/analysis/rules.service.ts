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
      cause: '调压器膜片可能老化或损坏',
      recommendation: '立即检查并更换膜片，停止设备运行',
    },
    {
      id: 'rule-002',
      priority: 2,
      condition: (anomalies: Anomaly[]) =>
        anomalies.some((a) => a.metric === 'temperature' && a.value > 60),
      cause: '设备温度异常，可能存在阀门卡滞',
      recommendation: '检查阀门润滑情况，清理阀门',
    },
    {
      id: 'rule-003',
      priority: 3,
      condition: (anomalies: Anomaly[]) =>
        anomalies.some((a) => a.metric === 'inletPressure' && a.zScore > 4),
      cause: '进口压力异常波动，可能是上游供气不稳定',
      recommendation: '检查上游管道和供气系统，联系供气单位',
    },
    {
      id: 'rule-004',
      priority: 4,
      condition: (anomalies: Anomaly[]) =>
        anomalies.some((a) => a.metric === 'flowRate' && a.zScore > 4),
      cause: '流量异常，可能存在管道泄漏或用气量突增',
      recommendation: '检查管道完整性，排查下游用气设备',
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
      cause: '出口压力和温度同时异常，可能是调压器整体故障',
      recommendation: '立即停机检修，更换调压器核心部件',
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
