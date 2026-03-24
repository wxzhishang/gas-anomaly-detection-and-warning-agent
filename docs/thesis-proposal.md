# 毕业设计开题报告

**题目：** 燃气设备运行的异常检测与预警AI Agent

**学生姓名：** [姓名]  
**学号：** [学号]  
**专业：** [专业]  
**指导教师：** [教师姓名]

---

## 一、选题的背景与意义

### 1.1 研究背景

燃气作为清洁能源在城市能源供应中占据重要地位。燃气调压器作为燃气输配系统的关键设备，负责将高压燃气降压至用户所需压力，其运行状态直接关系到供气安全和用户用气质量。据统计，燃气事故中约30%与调压设备故障相关[1]。传统的人工巡检方式存在效率低、成本高、难以实时监控等问题，无法满足现代化燃气管网的安全管理需求。

随着物联网（IoT）技术的发展，燃气设备已普遍配备多种传感器，可实时采集压力、温度、流量等运行数据。这些时序数据蕴含着设备运行状态的丰富信息，为智能化异常检测提供了数据基础。然而，传统的基于规则的监控系统难以应对复杂多变的异常模式，存在误报率高、漏报率高的问题。

近年来，人工智能技术特别是AI Agent（智能代理）技术的快速发展，为工业设备智能监控提供了新的解决方案。AI Agent具有自主感知、推理、决策和学习能力，能够持续监测设备状态、主动识别异常、分析故障原因并提供决策建议[2]。将AI Agent技术应用于燃气设备异常检测，可以显著提升监控的智能化水平和预警的准确性。

### 1.2 研究意义

**理论意义：**
1. 探索AI Agent在工业设备监控领域的应用模式，丰富智能代理理论在实际场景中的实践
2. 研究多模态时序数据的异常检测方法，为工业IoT数据分析提供新思路
3. 结合规则推理与大语言模型（LLM）的混合推理机制，探索可解释AI在安全关键系统中的应用

**实践意义：**
1. 提高燃气设备异常检测的准确性和实时性，降低误报率和漏报率
2. 实现从被动响应到主动预警的转变，提前发现潜在故障，减少事故发生
3. 降低人工巡检成本，提升运维效率，为燃气企业数字化转型提供技术支撑
4. 为其他工业设备的智能监控提供可复用的技术方案和实施经验



## 二、国内外研究现状

### 2.1 时序数据异常检测研究

时序数据异常检测是工业IoT领域的研究热点。现有方法主要分为三类：

**统计方法：** 基于Z-Score、移动平均、指数加权移动平均（EWMA）等统计指标进行异常判断。这类方法计算简单、可解释性强，但难以处理复杂的多维异常模式[3]。

**机器学习方法：** Isolation Forest作为一种高效的无监督异常检测算法，通过随机分割数据空间来隔离异常点，在工业场景中得到广泛应用[4][5]。Local Outlier Factor（LOF）、DBSCAN等基于密度的方法也被用于检测局部异常。

**深度学习方法：** LSTM Autoencoder通过学习时序数据的正常模式，利用重构误差识别异常，在多变量时序异常检测中表现优异[6][7]。Transformer等注意力机制模型也被应用于捕捉长期依赖关系。

针对IoT时序数据的特点，研究者提出了多种改进方法。Sensors期刊发表的研究表明，结合变点检测和统计方法可以提高IoT数据异常检测的准确性[8]。MDPI发表的研究展示了深度学习在多变量时序异常检测中的应用[9]。

### 2.2 工业设备故障诊断研究

在燃气和压力设备领域，已有研究探索了异常检测技术的应用。针对燃气管道的异常检测，研究者提出了基于机器学习的方法[10]。对于压力调节系统，研究表明时序分析方法可以有效识别异常行为模式[11]。

燃气涡轮机的异常检测研究采用了序列符号方法，在燃料系统监控中取得了良好效果[12]。这些研究为本课题提供了领域知识和方法参考。

### 2.3 AI Agent技术研究

AI Agent技术源于人工智能和多智能体系统研究。BDI（Belief-Desire-Intention）架构是经典的Agent理论模型，将Agent的认知过程分为信念、愿望和意图三个层次[13]。

近年来，随着大语言模型（LLM）的发展，AI Agent技术迎来新的突破。LangGraph作为新一代Agent编排框架，提供了基于图的状态机工作流，支持复杂的多Agent协作和条件转换[14][15]。在工业IoT领域，AI Agent被用于设备监控、预测性维护和生产优化[16][17]。

检索增强生成（RAG）技术通过将外部知识库与LLM结合，显著提升了AI系统的知识获取和推理能力[18][19]。这为构建具有领域知识的故障诊断Agent提供了技术基础。

### 2.4 现有研究的不足

尽管相关研究取得了一定进展，但仍存在以下不足：

1. **缺乏自主性：** 现有系统多为被动式监控，缺乏主动学习和决策能力
2. **可解释性不足：** 深度学习方法虽然准确率高，但难以解释异常原因，不利于运维人员理解和信任
3. **知识利用不充分：** 未能有效整合历史故障案例和专家经验
4. **缺乏闭环优化：** 缺少反馈机制，无法根据实际效果持续改进

本研究拟通过构建基于AI Agent的异常检测系统，结合统计方法、机器学习和LLM增强推理，实现自主、可解释、可学习的智能监控。



## 三、研究内容与目标

### 3.1 研究目标

本研究旨在构建一个基于AI Agent的燃气调压器异常检测与预警系统，实现以下目标：

1. **高准确率异常检测：** 准确识别压力、温度、流量等多维传感器数据的异常模式，误报率<10%，漏报率<5%
2. **智能根因分析：** 自动分析异常原因，提供可解释的诊断结果和处理建议
3. **实时预警响应：** 实现秒级异常检测和分钟级根因分析，及时发出预警
4. **持续学习优化：** 从历史案例和运维反馈中学习，不断优化检测策略

### 3.2 主要研究内容

#### 3.2.1 AI Agent架构设计

采用BDI（Belief-Desire-Intention）模型设计Agent架构：
- **信念层（Belief）：** 维护设备状态、历史模式、领域知识等信念库
- **愿望层（Desire）：** 定义保障安全、预防故障、优化运维等目标
- **意图层（Intention）：** 制定并执行监测、分析、预警等具体行动计划

设计多Agent协作架构，包括：
- 监测Agent：负责数据采集和质量检查
- 分析Agent：执行异常检测和根因分析
- 决策Agent：进行风险评估和策略制定
- 学习Agent：从历史数据中学习和优化
- 通知Agent：负责预警推送和报告生成
- 反馈Agent：收集运维反馈，实现闭环优化

#### 3.2.2 多层次异常检测方法

设计渐进式异常检测策略：

**第一层：统计方法**
- 基于Z-Score和IQR（四分位距）的快速检测
- 滑动窗口基线计算
- 适用于明显偏离正常范围的异常

**第二层：机器学习方法**
- Isolation Forest处理多维特征的关联异常
- 无监督学习，无需标注数据
- 捕捉统计方法难以发现的隐蔽异常

**第三层：规则引擎**
- 基于专家知识的故障规则库
- 快速匹配已知故障模式
- 提供可解释的诊断结果

#### 3.2.3 LLM增强的根因分析

设计基于LangGraph的分析工作流：

**工具系统：** 定义数据查询、相关性分析、案例检索等工具，供Agent调用

**RAG检索：** 
- 使用向量数据库（Milvus）存储历史故障案例
- 采用中文Embedding模型（bge-large-zh-v1.5）进行语义检索
- 检索相似案例为LLM提供上下文

**推理流程：**
- 观察异常表现 → 提出故障假设 → 验证相关指标 → 推理因果关系 → 得出结论 → 生成建议
- 支持多模型切换（GPT、Claude等），降低供应商依赖

#### 3.2.4 记忆与学习机制

**短期记忆：** 使用Redis存储实时状态和会话上下文

**长期记忆：** 
- TimescaleDB存储时序数据
- Milvus存储案例向量
- 支持混合检索（语义+关键词+时间+元数据）

**学习机制：**
- 收集运维人员反馈（确认、误报标记、处理结果）
- 分析预警效果（准确率、响应时间、满意度）
- 更新检测阈值和规则库
- 优化案例检索索引

#### 3.2.5 系统实现与部署

**技术栈选型：**
- Agent框架：LangGraph（状态机工作流）
- 后端：Bun + NestJS + TypeScript
- 前端：Next.js 14 + Tailwind CSS + ECharts
- 数据库：TimescaleDB（时序）+ Redis（缓存）+ Milvus（向量）
- 消息队列：BullMQ（异步任务）

**部署方案：**
- 容器化部署（Docker + Docker Compose）
- 支持水平扩展和垂直扩展
- 完善的监控和日志系统



## 四、研究方法与技术路线

### 4.1 研究方法

本研究采用理论研究与系统开发相结合的方法：

**文献研究法：** 系统梳理AI Agent、时序异常检测、故障诊断等领域的研究成果，为系统设计提供理论基础。

**系统设计法：** 基于BDI模型和多Agent协作理论，设计系统架构和工作流程。

**实验验证法：** 通过模拟数据和实际数据测试系统性能，验证方法的有效性。

**迭代优化法：** 根据测试结果和用户反馈，持续优化算法和策略。

### 4.2 技术路线

本研究的技术路线如下图所示：

```
需求分析 → 架构设计 → 核心算法实现 → 系统集成 → 测试优化 → 部署应用
    ↓          ↓            ↓              ↓          ↓          ↓
 功能需求   Agent架构   异常检测算法    前后端开发   性能测试   生产部署
 性能需求   数据流设计   根因分析算法    数据库集成   功能测试   运维监控
 安全需求   接口设计     学习机制        Agent编排    用户测试   持续优化
```

**具体步骤：**

**第一阶段：需求分析与架构设计（第1-2周）**
- 调研燃气设备监控需求和痛点
- 分析传感器数据特征和异常模式
- 设计AI Agent架构和多Agent协作机制
- 确定技术栈和开发环境

**第二阶段：基础设施搭建（第3-4周）**
- 搭建开发环境（Bun + NestJS + Next.js）
- 部署数据库（TimescaleDB、Redis、Milvus）
- 配置Embedding服务（bge-large-zh-v1.5）
- 实现数据采集和存储模块

**第三阶段：异常检测算法实现（第5-8周）**
- 实现统计方法（Z-Score、IQR）
- 实现Isolation Forest算法
- 构建规则引擎和规则库
- 开发定时检测任务
- 测试和调优检测参数

**第四阶段：根因分析模块开发（第9-12周）**
- 集成LangGraph工作流引擎
- 实现工具系统（数据查询、相关性分析等）
- 集成Milvus向量数据库和RAG检索
- 开发LLM推理模块（支持多模型）
- 构建历史案例库

**第五阶段：系统集成与前端开发（第13-14周）**
- 开发监控面板（Next.js + ECharts）
- 实现WebSocket实时通信
- 集成预警推送功能
- 开发反馈收集界面

**第六阶段：测试与优化（第15-16周）**
- 功能测试：验证各模块功能正确性
- 性能测试：测试响应时间和并发能力
- 准确性测试：评估检测准确率和误报率
- 用户测试：收集用户反馈并优化

**第七阶段：论文撰写与答辩准备（第17-18周）**
- 整理研究成果和实验数据
- 撰写毕业论文
- 准备答辩材料

### 4.3 关键技术

**多维时序异常检测：** 结合统计方法和机器学习，处理多传感器数据的关联异常

**LangGraph工作流编排：** 实现复杂的Agent推理循环和状态管理

**RAG知识检索：** 利用向量数据库和语义检索，增强LLM的领域知识

**实时数据处理：** 基于流式处理和消息队列，实现秒级异常响应

**可解释AI：** 结合规则推理和LLM生成，提供可理解的诊断结果



## 五、预期成果

### 5.1 理论成果

1. 提出一种基于AI Agent的工业设备异常检测架构，结合BDI模型和多Agent协作
2. 设计渐进式异常检测策略，融合统计方法、机器学习和规则推理
3. 探索LLM增强的根因分析方法，提升故障诊断的准确性和可解释性
4. 建立反馈学习机制，实现系统的持续优化

### 5.2 实践成果

1. **完整的系统原型**
   - 基于LangGraph的AI Agent系统
   - 支持多设备实时监控
   - 提供Web可视化界面

2. **核心功能模块**
   - 多层次异常检测模块（统计+机器学习+规则）
   - LLM增强的根因分析模块
   - RAG知识检索模块
   - 实时预警推送模块
   - 反馈学习模块

3. **性能指标**
   - 异常检测准确率 > 90%
   - 误报率 < 10%
   - 漏报率 < 5%
   - 异常检测响应时间 < 5秒
   - 根因分析时间 < 30秒

4. **技术文档**
   - 系统设计文档
   - API接口文档
   - 部署运维文档
   - 用户使用手册

### 5.3 学术成果

1. 完成毕业论文一篇，系统阐述研究内容和成果
2. 力争在相关会议或期刊发表学术论文
3. 开源系统代码，为相关研究提供参考



## 六、进度安排

| 阶段 | 时间 | 主要任务 | 预期成果 |
|------|------|----------|----------|
| 第一阶段 | 第1-2周 | 需求分析与架构设计 | 需求文档、架构设计文档 |
| 第二阶段 | 第3-4周 | 基础设施搭建 | 开发环境、数据库部署完成 |
| 第三阶段 | 第5-8周 | 异常检测算法实现 | 异常检测模块完成 |
| 第四阶段 | 第9-12周 | 根因分析模块开发 | 根因分析模块完成 |
| 第五阶段 | 第13-14周 | 系统集成与前端开发 | 完整系统原型 |
| 第六阶段 | 第15-16周 | 测试与优化 | 测试报告、优化版本 |
| 第七阶段 | 第17-18周 | 论文撰写与答辩准备 | 毕业论文、答辩PPT |

**关键时间节点：**
- 第4周末：完成基础设施搭建，能够采集和存储数据
- 第8周末：完成异常检测模块，能够识别基本异常
- 第12周末：完成根因分析模块，能够提供诊断建议
- 第14周末：完成系统集成，形成可演示的原型
- 第16周末：完成测试优化，系统达到预期性能指标
- 第18周末：完成论文撰写，准备答辩

## 七、可行性分析

### 7.1 技术可行性

**成熟的技术栈：** 本研究采用的技术均为成熟的开源技术，有丰富的文档和社区支持：
- LangGraph：LangChain官方推出的Agent编排框架，文档完善
- Bun + NestJS：现代化的后端技术栈，性能优异
- TimescaleDB：基于PostgreSQL的时序数据库，稳定可靠
- Milvus：开源向量数据库，广泛应用于RAG场景

**算法可实现性：** 
- 统计方法和Isolation Forest算法实现简单，已有成熟库支持
- LangGraph提供了完整的Agent开发框架
- 多个开源项目展示了类似系统的可行性

**开发环境完备：** 具备完整的开发环境和工具链，支持快速开发和调试

### 7.2 数据可行性

**数据来源：** 
- 可通过数据生成器模拟真实的传感器数据
- 模拟数据包含正常模式和多种异常模式
- 支持多设备并发数据生成

**数据质量：** 
- 数据生成器可控制异常比例和类型
- 可模拟真实场景中的数据特征（噪声、缺失值等）
- 便于算法测试和性能评估

### 7.3 时间可行性

**合理的时间规划：** 18周的开发周期，每个阶段任务明确，时间分配合理

**渐进式实施：** 采用MVP（最小可行产品）策略，先实现核心功能，再逐步完善

**风险预留：** 预留2周时间用于测试和优化，应对可能的技术难题

### 7.4 经济可行性

**低成本方案：**
- 使用开源技术，无需购买商业软件
- 本地部署Embedding模型，降低API成本
- 支持多LLM模型切换，可选择性价比高的模型
- 开发环境可在个人电脑上运行

**可扩展性：** 系统设计支持从小规模到大规模的平滑扩展

## 八、创新点

1. **Agent架构创新：** 将BDI模型应用于工业设备监控，设计了多Agent协作架构，实现了从感知到决策的完整闭环

2. **混合推理机制：** 结合规则推理、机器学习和LLM推理，兼顾准确性、可解释性和灵活性

3. **RAG增强诊断：** 利用向量检索技术整合历史案例和专家知识，提升根因分析的准确性

4. **持续学习机制：** 建立反馈闭环，从运维实践中学习，实现系统的自我优化

5. **渐进式检测策略：** 设计多层次异常检测方法，从简单到复杂，平衡准确性和效率



## 九、参考文献

[1] 国家应急管理部. 2023年全国燃气事故分析报告[R]. 2024.

[2] N-IX. AI agents in industrial IoT: The next step in automation[EB/OL]. https://www.n-ix.com/ai-agents-in-industrial-iot/, 2025.

[3] MDPI. Unsupervised Anomaly Detection for IoT-Based Multivariate Time Series[J]. Sensors, 2023, 23(5): 2844. https://www.mdpi.com/1424-8220/23/5/2844

[4] Liu F T, Ting K M, Zhou Z H. Isolation Forest[C]//2008 Eighth IEEE International Conference on Data Mining. IEEE, 2008: 413-422. https://www.researchgate.net/publication/224384174_Isolation_Forest

[5] Liu F T, Ting K M, Zhou Z H. Isolation-Based Anomaly Detection[J]. ACM Transactions on Knowledge Discovery from Data, 2012, 6(1): 1-39. https://www.researchgate.net/publication/239761771_Isolation-Based_Anomaly_Detection

[6] ResearchGate. LSTM-Autoencoder based Anomaly Detection for Indoor Air Quality Time Series Data[J]. IEEE Sensors Journal, 2022. https://www.researchgate.net/publication/359971278_LSTM-Autoencoder_based_Anomaly_Detection_for_Indoor_Air_Quality_Time_Series_Data

[7] Malhotra P, Ramakrishnan A, Anand G, et al. LSTM-based encoder-decoder for multi-sensor anomaly detection[C]//ICML 2016 Anomaly Detection Workshop. 2016. https://www.researchgate.net/publication/351247203_Unsupervised_anomaly_detection_with_LSTM_autoencoders_using_statistical_data-filtering

[8] MDPI. Change Point Enhanced Anomaly Detection for IoT Time Series Data[J]. Water, 2021, 13(12): 1633. https://www.mdpi.com/2073-4441/13/12/1633

[9] MDPI. Deep Learning-Based Time-Series Analysis for Detecting Anomalies in Internet of Things[J]. Electronics, 2022, 11(19): 3205. https://www.mdpi.com/2079-9292/11/19/3205

[10] MDPI. An Anomaly Detection Model for Oil and Gas Pipelines Using Machine Learning[J]. Applied Sciences, 2022, 10(8): 138. https://www.mdpi.com/2079-3197/10/8/138

[11] arXiv. Anomaly Detection and Inlet Pressure Prediction in Water Distribution Systems Using Machine Learning[J]. 2024. https://arxiv.org/abs/2410.09530

[12] ResearchGate. Anomaly Detection in Gas Turbine Fuel Systems Using a Sequential Symbolic Method[J]. Energies, 2017. https://www.researchgate.net/publication/317114729_Anomaly_Detection_in_Gas_Turbine_Fuel_Systems_Using_a_Sequential_Symbolic_Method

[13] Rao A S, Georgeff M P. BDI Agents: From Theory to Practice[C]//Proceedings of the First International Conference on Multi-Agent Systems (ICMAS-95). 1995: 312-319.

[14] BIX Tech. LangGraph in Practice: Orchestrating Multi-Agent Systems and Distributed AI Flows at Scale[EB/OL]. https://bix-tech.com/langgraph-in-practice-orchestrating-multiagent-systems-and-distributed-ai-flows-at-scale/, 2025.

[15] BIX Tech. Agent Orchestration and Agent-to-Agent Communication with LangGraph[EB/OL]. https://bix-tech.com/agent-orchestration-and-agenttoagent-communication-with-langgraph-a-practical-guide/, 2024.

[16] MQTT-BLE. Unlocking Operational Excellence: A Deep Dive into Industrial IoT AI Agents[EB/OL]. https://mqtt-ble.com/resources/industrial-iot-ai-agents, 2025.

[17] HiveMQ. Establishing Multi-Agent Frameworks for Coordinated Industrial Intelligence[EB/OL]. https://www.hivemq.com/blog/establishing-multi-agent-frameworks-coordinated-industrial-intelligence, 2024.

[18] IBM. What is RAG (Retrieval Augmented Generation)?[EB/OL]. https://www.ibm.com/think/topics/retrieval-augmented-generation, 2024.

[19] Nanonets. Retrieval Augmented Generation (RAG) for Smarter AI Workflows[EB/OL]. https://nanonets.com/blog/retrieval-augmented-generation-workflows/, 2025.

---

**指导教师意见：**

<br/><br/><br/>

签名：________________  日期：________________

---

**学院意见：**

<br/><br/><br/>

签名（盖章）：________________  日期：________________

