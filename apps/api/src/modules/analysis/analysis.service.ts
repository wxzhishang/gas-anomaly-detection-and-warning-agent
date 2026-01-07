import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { Anomaly } from '../../common/types/anomaly.types';
import { RulesService } from './rules.service';
import { AnalysisMethod, RootCauseResult } from './analysis.types';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private llm: ChatOpenAI | null = null;
  private readonly promptTemplate: PromptTemplate;
  private readonly llmConfig: { apiKey: string; baseURL: string; model: string };

  constructor(
    @Inject(forwardRef(() => RulesService))
    private readonly rulesService: RulesService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log(`AnalysisService initialized`);
    this.logger.log(`   rulesService: ${!!rulesService}`);
    this.logger.log(`   configService: ${!!configService}`);
    
    // 在构造函数中保存配置，避免后续this上下文丢失
    this.llmConfig = {
      apiKey: configService?.get('GAS_LLM_API_KEY') || '',
      baseURL: configService?.get('GAS_LLM_BASE_URL') || '',
      model: configService?.get('GAS_LLM_MODEL') || 'gpt-3.5-turbo',
    };
    
    this.logger.log(`   LLM_BASE_URL: ${this.llmConfig.baseURL}`);
    this.logger.log(`   LLM_MODEL: ${this.llmConfig.model}`);
    this.logger.log(`   LLM_API_KEY: ${this.llmConfig.apiKey ? '已配置' : '未配置'}`);
    
    // 绑定方法以保持this上下文
    this.analyzeRootCause = this.analyzeRootCause.bind(this);
    this.llmAnalysis = this.llmAnalysis.bind(this);
    this.getLLM = this.getLLM.bind(this);
    
    // 初始化提示词模板
    this.promptTemplate = PromptTemplate.fromTemplate(`
你是一个燃气调压器故障诊断专家。

检测到以下异常：
{anomalies}

请分析：
1. 最可能的故障原因
2. 具体的处理建议
3. 风险等级评估

以JSON格式返回：
{{
  "cause": "故障原因",
  "recommendation": "处理建议",
  "riskLevel": "high/medium/low"
}}
`);
  }

  /**
   * 获取或初始化LLM客户端
   */
  private getLLM(): ChatOpenAI {
    if (!this.llm) {
      this.logger.log('初始化LLM客户端...');
      this.logger.log(`   使用保存的配置`);
      this.logger.log(`   BASE_URL: ${this.llmConfig.baseURL}`);
      this.logger.log(`   MODEL: ${this.llmConfig.model}`);
      this.logger.log(`   API_KEY: ${this.llmConfig.apiKey ? '已配置' : '未配置'}`);
      
      if (!this.llmConfig.apiKey) {
        throw new Error('LLM API Key未配置');
      }
      
      this.llm = new ChatOpenAI({
        openAIApiKey: this.llmConfig.apiKey,
        modelName: this.llmConfig.model,
        temperature: 0.3,
        timeout: 30000, // 30秒超时
        configuration: this.llmConfig.baseURL ? { baseURL: this.llmConfig.baseURL } : undefined,
      });
      
      this.logger.log('✅ LLM客户端初始化完成');
    }
    return this.llm;
  }

  /**
   * 分析异常根因
   * 首先尝试规则匹配，如果没有匹配则调用LLM分析
   */
  async analyzeRootCause(anomalies: Anomaly[]): Promise<RootCauseResult> {
    this.logger.log(
      `Analyzing root cause for ${anomalies.length} anomalies`,
    );

    // 尝试规则匹配
    const ruleMatch = this.rulesService.matchRules(anomalies);

    if (ruleMatch) {
      this.logger.log(`Rule matched: ${ruleMatch.ruleId}`);
      return {
        cause: ruleMatch.cause,
        recommendation: ruleMatch.recommendation,
        confidence: 0.8,
        method: AnalysisMethod.RULE_BASED,
        ruleId: ruleMatch.ruleId,
      };
    }

    // 规则未匹配，调用LLM分析
    this.logger.log('No rule matched, using LLM analysis');
    return await this.llmAnalysis(anomalies);
  }

  /**
   * LLM增强分析
   * 使用LLM分析异常根因，包含30秒超时和降级策略
   */
  private async llmAnalysis(anomalies: Anomaly[]): Promise<RootCauseResult> {
    try {
      this.logger.log('Starting LLM analysis');
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 格式化异常信息
      const anomaliesText = anomalies
        .map(
          (a) =>
            `- ${a.metric}: 实际值=${a.value}, 基线=${a.baseline}, Z-Score=${a.zScore.toFixed(2)}, 偏离=${a.deviation.toFixed(1)}%`,
        )
        .join('\n');

      this.logger.log('📊 输入数据（异常信息）:');
      this.logger.log(anomaliesText);
      this.logger.log('');

      // 构建提示词
      const prompt = await this.promptTemplate.format({
        anomalies: anomaliesText,
      });

      this.logger.log('📝 发送给LLM的完整提示词:');
      this.logger.log('─────────────────────────────────────────');
      this.logger.log(prompt);
      this.logger.log('─────────────────────────────────────────');
      this.logger.log('');

      this.logger.log('⏳ 正在等待LLM响应（最长30秒）...');
      const startTime = Date.now();

      // 使用Promise.race实现30秒超时
      const result = await Promise.race([
        this.getLLM().invoke(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('LLM timeout')), 30000),
        ),
      ]);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`✅ LLM响应成功！耗时: ${duration}秒`);
      this.logger.log('');

      this.logger.log('📥 LLM原始响应内容:');
      this.logger.log('─────────────────────────────────────────');
      this.logger.log(result.content);
      this.logger.log('─────────────────────────────────────────');
      this.logger.log('');

      // 解析LLM响应
      this.logger.log('🔍 开始解析LLM响应...');
      const parsedResult = this.parseResult(result.content as string);

      this.logger.log('✅ 解析成功！');
      this.logger.log('📋 解析后的结果:');
      this.logger.log(`   故障原因: ${parsedResult.cause}`);
      this.logger.log(`   处理建议: ${parsedResult.recommendation}`);
      this.logger.log(`   风险等级: ${parsedResult.riskLevel}`);
      this.logger.log('');

      this.logger.log('LLM analysis completed successfully');
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return {
        cause: parsedResult.cause,
        recommendation: parsedResult.recommendation,
        confidence: 0.6,
        method: AnalysisMethod.LLM_ENHANCED,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`❌ LLM分析失败`);
      this.logger.error(`   错误信息: ${errorMessage}`);
      this.logger.error(`   错误堆栈: ${errorStack}`);
      this.logger.warn(`使用默认结果作为降级策略`);
      return this.getDefaultResult();
    }
  }

  /**
   * 解析LLM返回的JSON结果
   */
  private parseResult(content: string): {
    cause: string;
    recommendation: string;
    riskLevel: string;
  } {
    try {
      // 尝试提取JSON内容
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          cause: parsed.cause || '未知故障',
          recommendation: parsed.recommendation || '建议人工检查',
          riskLevel: parsed.riskLevel || 'medium',
        };
      }

      // 如果没有找到JSON，尝试直接解析
      const parsed = JSON.parse(content);
      return {
        cause: parsed.cause || '未知故障',
        recommendation: parsed.recommendation || '建议人工检查',
        riskLevel: parsed.riskLevel || 'medium',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to parse LLM result: ${errorMessage}`);
      return {
        cause: '系统分析异常',
        recommendation: '建议人工检查设备状态',
        riskLevel: 'medium',
      };
    }
  }

  /**
   * 获取默认分析结果（降级策略）
   */
  private getDefaultResult(): RootCauseResult {
    return {
      cause: '系统正在分析中，请稍后查看详细结果',
      recommendation: '建议人工检查设备状态',
      confidence: 0.3,
      method: AnalysisMethod.LLM_ENHANCED,
    };
  }
}
