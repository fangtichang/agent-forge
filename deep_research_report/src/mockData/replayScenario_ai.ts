import type { ReplayScenario, SubTask, Citation } from '@/types';

/**
 * Pre-recorded replay scenario for "人工智能行业深度分析".
 *
 * Provides realistic demo data with:
 * - 5 sub-tasks covering key dimensions of AI industry analysis
 * - Token-level chapter chunks for streaming simulation
 * - Real citations with clickable URLs from authoritative sources
 * - 1 follow-up Q&A about robot technology comparison
 */

const citations: { [key: string]: Citation[] } = {
  ch1: [
    {
      id: 1,
      url: 'https://www.idc.com/getdoc.jsp?containerId=prUS52310224',
      title: 'IDC: Worldwide AI Market Forecast, 2024-2028',
      snippet: '全球AI市场预计2028年将达到6320亿美元，年复合增长率29.1%。',
    },
    {
      id: 2,
      url: 'https://www.gartner.com/en/newsroom/press-releases/2024-04-03-gartner-says-worldwide-ai-software-revenue-to-grow-21-percent',
      title: 'Gartner: AI Software Revenue Forecast 2024',
      snippet: '全球AI软件收入预计2024年增长21%，达到1358亿美元。',
    },
    {
      id: 3,
      url: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai',
      title: 'McKinsey: The State of AI in 2024',
      snippet: '2024年生成式AI采用率翻倍，65%组织已常规使用生成式AI。',
    },
    {
      id: 4,
      url: 'https://www.statista.com/outlook/tmo/artificial-intelligence/worldwide',
      title: 'Statista: AI Market Outlook Worldwide',
      snippet: '全球AI市场规模2025年预计达到2437亿美元。',
    },
  ],
  ch2: [
    {
      id: 5,
      url: 'https://openai.com/blog',
      title: 'OpenAI Official Blog - Latest Updates',
      snippet: 'OpenAI持续发布GPT系列模型，引领大语言模型技术前沿。',
    },
    {
      id: 6,
      url: 'https://ai.google/research',
      title: 'Google AI Research & Publications',
      snippet: 'Google发布Gemini多模态模型，在多项基准测试中达到SOTA。',
    },
    {
      id: 7,
      url: 'https://www.anthropic.com/research',
      title: 'Anthropic Research - Claude Model Family',
      snippet: 'Anthropic推出Claude系列，以安全性和长上下文为差异化优势。',
    },
  ],
  ch3: [
    {
      id: 8,
      url: 'https://arxiv.org/abs/2307.09288',
      title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models',
      snippet: 'Meta发布Llama 2开源大模型，引发开源AI社区快速发展。',
    },
    {
      id: 9,
      url: 'https://arxiv.org/abs/2403.05530',
      title: 'Claude 3 Model Card - Anthropic Technical Report',
      snippet: 'Anthropic发布Claude 3系列，在推理和编码能力上大幅提升。',
    },
    {
      id: 10,
      url: 'https://huggingface.co/blog/leaderboards',
      title: 'Hugging Face Open LLM Leaderboard',
      snippet: '开源大模型评测排行榜，追踪各类开源模型的性能演进。',
    },
    {
      id: 11,
      url: 'https://spectrum.ieee.org/topic/artificial-intelligence/',
      title: 'IEEE Spectrum: Artificial Intelligence',
      snippet: 'MoE（混合专家）架构成为大模型新趋势，有效平衡性能与成本。',
    },
  ],
  ch4: [
    {
      id: 12,
      url: 'https://www.cbinsights.com/research/report/artificial-intelligence-trends-2024/',
      title: 'CB Insights: AI 100 - Top AI Startups 2024',
      snippet: '2024年AI初创公司融资总额突破500亿美元，创历史新高。',
    },
    {
      id: 13,
      url: 'https://pitchbook.com/news/reports/q4-2024-emerging-tech-research-ai-and-ml',
      title: 'PitchBook: AI & ML Venture Capital Report Q4 2024',
      snippet: 'AI/ML领域VC投资连续5个季度增长，Q4 2024达280亿美元。',
    },
    {
      id: 14,
      url: 'https://www.crunchbase.com/hub/artificial-intelligence-companies',
      title: 'Crunchbase: AI Company Funding Rounds',
      snippet: '全球AI独角兽企业数量突破150家，总估值超8000亿美元。',
    },
  ],
  ch5: [
    {
      id: 15,
      url: 'https://www.weforum.org/agenda/2024/ai-risks-regulation-governance/',
      title: 'World Economic Forum: AI Governance and Regulation 2024',
      snippet: '全球AI治理进入加速期，欧盟AI Act成为首个全面AI监管框架。',
    },
    {
      id: 16,
      url: 'https://www.brookings.edu/articles/ai-regulation-around-the-world/',
      title: 'Brookings: AI Regulation Around the World',
      snippet: '各国AI监管政策对比：欧盟风险分级、美国自愿承诺、中国分类监管。',
    },
    {
      id: 17,
      url: 'https://oecd.ai/en/',
      title: 'OECD AI Policy Observatory',
      snippet: 'OECD发布AI政策观察站，追踪全球60+国家的AI政策制定进展。',
    },
    {
      id: 18,
      url: 'https://www2.deloitte.com/us/en/insights/focus/tech-trends.html',
      title: 'Deloitte Tech Trends 2025: AI Everywhere',
      snippet: 'AI从技术工具向企业核心战略转变，AI原生企业正在重塑行业格局。',
    },
  ],
};

const followUpCitations: Citation[] = [
  {
    id: 100,
    url: 'https://www.figure.ai/',
    title: 'Figure AI - Official Website',
    snippet: 'Figure AI致力于开发通用人形机器人，已获得6.75亿美元B轮融资。',
  },
  {
    id: 101,
    url: 'https://www.tesla.com/optimus',
    title: 'Tesla Optimus - Official Page',
    snippet: 'Tesla Optimus Gen 2在行走速度、手部灵巧度和重量上均有显著改进。',
  },
];

/**
 * Chapter content split into token-level chunks for realistic streaming.
 * Each chunk is 20-50 characters to simulate token-by-token generation.
 */

const splitIntoChunks = (text: string, maxChunkSize: number = 40): string[] => {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    // Try to split at a natural boundary (punctuation or space)
    let end = Math.min(maxChunkSize, remaining.length);
    if (end < remaining.length) {
      const boundary = remaining.lastIndexOf('，', end);
      const boundary2 = remaining.lastIndexOf('。', end);
      const boundary3 = remaining.lastIndexOf('、', end);
      const bestBoundary = Math.max(boundary, boundary2, boundary3);
      if (bestBoundary > maxChunkSize / 2) {
        end = bestBoundary + 1;
      }
    }
    chunks.push(remaining.slice(0, end));
    remaining = remaining.slice(end);
  }
  return chunks;
};

const ch1Text = `## 一、人工智能市场概览：规模与增速

全球人工智能市场正经历前所未有的高速增长。根据 IDC 最新报告显示，2024年全球AI市场规模已突破3500亿美元，预计到2028年将达到6320亿美元，年复合增长率高达29.1%。生成式AI的爆发式发展是这一增长的主要驱动力，2024年相关投资同比增长超过200%。

从区域分布来看，北美仍是最大的AI市场，占据全球份额的42%。亚太地区增速最快，中国市场在政策支持和产业数字化推动下，2024年AI市场规模超过800亿元人民币，预计2025年将突破千亿大关。欧洲市场则受欧盟AI Act推动，合规性需求带动了新一轮投资浪潮。

在行业应用方面，金融、医疗和制造业是AI落地的三大核心领域。金融行业AI支出占比最高，主要用于风控、智能投顾和反欺诈。医疗AI在影像诊断和药物研发领域取得突破性进展，2024年FDA批准的AI医疗设备数量创新高。制造业AI则聚焦预测性维护和智能质检，帮助企业降低运营成本15%-30%。[citation:1][citation:2]

技术供给端同样呈现繁荣景象。基础模型层，OpenAI、Google、Anthropic等公司持续推陈出新；中间件层，LangChain、LlamaIndex等工具生态日趋成熟；应用层，各类垂直AI应用百花齐放。整体来看，AI产业已从技术验证阶段进入大规模商业落地阶段，产业链各环节均呈现供不应求的态势。[citation:3][citation:4]`;

const ch2Text = `## 二、主要玩家分析：竞争格局与战略布局

全球AI产业的竞争格局正在快速演变，形成了以科技巨头为核心、创业公司为创新的多层次竞争态势。

OpenAI凭借GPT系列模型稳居第一梯队，2024年发布的GPT-4o实现了多模态能力的重大突破，支持文本、图像、音频的实时交互处理。公司在企业级市场加速渗透，ChatGPT Enterprise已服务超过60万家组织。与微软的深度合作进一步巩固了其云计算和分发渠道优势。[citation:5]

Google通过Gemini模型家族全力追赶，在MMLU、HumanEval等多项基准测试中与GPT-4o互有胜负。Google的核心优势在于其搜索引擎的流量入口、YouTube的海量视频数据以及TPU芯片的算力保障。2024年Google将AI深度整合进Workspace全系产品，展现了强大的生态协同能力。[citation:6]

Anthropic采取差异化策略，以安全和可靠性为核心卖点。Claude 3.5 Sonnet在编程和长文本处理方面表现出色，200K上下文窗口满足了对长文档分析有刚需的企业客户。公司已获得来自亚马逊和谷歌总计超过70亿美元的投资，估值突破400亿美元。[citation:7]

中国阵营中，百度文心一言、字节豆包、阿里通义千问和腾讯混元构成了第一梯队。其中字节跳动旗下的豆包App凭借抖音的流量优势，用户增长迅猛，月活突破8000万。深度求索凭借DeepSeek-V3以极低的训练成本实现了接近GPT-4的性能，引发全球关注。月之暗面的Kimi以超长上下文为特色，在产品体验上获得用户好评。

值得注意的是，开源阵营的崛起正在改变竞争规则。Meta的Llama 3系列、Mistral AI以及国内的Qwen系列开源模型，使得AI能力不再是少数巨头的专利。这一趋势正在推动AI产业的民主化进程。`;

const ch3Text = `## 三、核心技术路线：架构演进与创新方向

当前AI大模型的技术路线正呈现出多元化发展的态势，几大技术方向值得密切关注。

Transformer架构仍然是主流基础，但优化变体层出不穷。混合专家模型架构成为2024-2025年最重要的架构创新。MoE通过动态激活部分参数，在保持模型能力的同时大幅降低推理成本。Google的Gemini、Mistral的Mixtral系列均采用此架构，实现了性能与效率的更好平衡。据估算，MoE架构可将推理成本降低40%-60%，这对大规模商业部署至关重要。[citation:8][citation:11]

多模态融合是另一个关键技术趋势。从GPT-4V到GPT-4o，再到Google Gemini的原生多模态设计，模型正在从单一文本处理转向真正的多感官理解。2024年底，视频理解能力成为新的竞争焦点，多家公司发布了支持实时视频分析的模型能力。这种融合使得AI能够理解更丰富的现实世界信息，为具身智能和机器人领域的发展奠定了基础。[citation:9]

在训练方法上，RLHF仍是主流对齐技术，但DPO和KTO等新方法因其效率和稳定性受到更多关注。合成数据的使用也越来越普遍，有效缓解了高质量训练数据不足的问题。根据行业报告，2024年超过70%的大模型训练使用了某种形式的合成数据。

小型化和端侧部署是2024年另一个显著趋势。微软Phi-3系列、Google Gemma以及面壁智能的MiniCPM系列证明了小模型也可以达到令人印象深刻的性能。Apple Intelligence的发布标志着端侧AI时代的正式开启，NPU正在成为手机和PC的标配硬件。[citation:10]`;

const ch4Text = `## 四、融资动态：资本流向与投资热点

2024年是AI行业融资创纪录的一年，全球AI初创公司融资总额首次突破1000亿美元大关。

从融资阶段来看，巨额融资事件频发。OpenAI完成66亿美元的新一轮融资，估值达到1570亿美元，创下硅谷历史最高估值纪录。Anthropic获得亚马逊追加的40亿美元投资，成为AWS的主要AI合作伙伴。xAI在一年内完成两轮融资，总额超过60亿美元。国内方面，月之暗面完成超10亿美元融资，智谱AI、百川智能、MiniMax等也均获得数亿美元级别投资。[citation:12]

从投资方向来看，2024年AI投资呈现三个明显特征：一是基础模型层资金高度集中，前5大模型公司占据了超过60%的融资额；二是AI基础设施投资快速增长，GPU云服务、AI数据中心成为新的投资热点；三是垂直应用层投资趋向理性，投资方更加关注商业落地能力和收入验证。

企业级AI服务和AI Agent赛道成为2024年下半年最活跃的投资方向。微软、Salesforce、ServiceNow等企业软件巨头纷纷推出AI Agent产品，创业公司如CrewAI、AutoGen等也获得资本追捧。分析机构预测，AI Agent市场规模到2030年将达到470亿美元。[citation:13]

值得注意的是，2024年Q4出现了投资节奏放缓的迹象。一级市场开始更加关注AI公司的商业模式可持续性。投资者对单纯烧钱换规模的公司趋于谨慎，转而偏好技术壁垒高、客户留存好的企业。行业正在从"融资竞赛"转向"价值验证"阶段。[citation:14]`;

const ch5Text = `## 五、未来趋势：监管、伦理与行业展望

展望未来3-5年，AI行业将在技术创新、监管治理和产业融合的多重驱动下持续演进。

监管方面，全球AI治理框架正在加速成型。欧盟AI Act已于2024年正式生效，采用风险分级管理模式，对高风险AI系统提出严格合规要求。中国实施了生成式AI服务管理暂行办法，要求AI生成内容进行标识。美国则通过行政令和行业自律相结合的方式推进治理。预计未来2-3年，全球主要经济体都将建立较为完善的AI监管体系。[citation:15][citation:16]

AGI（通用人工智能）的发展路径成为业界最受关注的话题。OpenAI的五级AGI路线图提供了一种框架性思考，从目前的对话式AI到最终的组织级AI管理能力。业界对AGI实现时间表存在分歧，从5年到50年不等。但共识在于：即使未达到AGI，持续的能力跃迁已足以对经济社会产生深刻影响。[citation:17]

行业应用将进入深度融合期。AI将从辅助工具转变为企业的核心生产力基础设施。AI原生企业正在崛起——这些企业从创立之初就以AI为核心构建业务模式，在效率上对传统企业形成降维打击。到2030年，预计AI将为全球经济贡献15.7万亿美元的增量价值。[citation:18]

最后，人才格局也在发生根本性变化。AI工程师成为全球最紧缺的技术岗位，薪资水平持续攀升。同时，AI素养正成为所有行业从业者的基本能力要求。企业和个人都需要积极拥抱这一变革，方能在AI时代保持竞争力。`;

const followUpAnswer = `Figure AI和Tesla Optimus代表了人形机器人领域两种截然不同的技术路线。

Figure AI更加聚焦于通用操作能力。其Figure 02机器人在手部灵巧度上投入了大量研发资源，采用了仿人手设计的五指灵巧手，具备21个自由度，能够完成精细的操作任务如抓取杯子、使用工具等。Figure与OpenAI的深度合作使其在人机交互和任务理解方面具有显著优势——机器人能够理解自然语言指令并自主规划执行路径。这使得Figure的机器人更适合仓储物流、制造业组装等场景。

Tesla Optimus则更侧重于大规模量产和成本控制。Optimus Gen 2展现了Tesla在电机、电池和传感器方面的垂直整合优势。通过复用特斯拉电动车的大量零部件，Optimus的物料成本显著降低。更重要的是，Tesla计划利用其超级工厂的高度自动化产线来生产Optimus本身，这在规模经济上具有指数级优势。不过，Optimus在手部操作精细度上相对Figure略逊一筹，其设计理念更偏向结构化环境下的重复性任务。

综合来看，Figure AI选择了"先做精、再做大"的路线，而Tesla选择了"先做大、再做精"的路线。两种路线各有利弊，最终市场将验证哪种策略更优。此外，还有傅利叶智能、宇树科技等中国企业也在快速追赶，人形机器人赛道的竞争格局远未确定。[citation:100][citation:101]`;

const ch1Chunks = splitIntoChunks(ch1Text);
const ch2Chunks = splitIntoChunks(ch2Text);
const ch3Chunks = splitIntoChunks(ch3Text);
const ch4Chunks = splitIntoChunks(ch4Text);
const ch5Chunks = splitIntoChunks(ch5Text);

const followUpChunks = splitIntoChunks(followUpAnswer);

const buildCitationChunks = (
  chunks: string[],
  chapterCitations: Citation[],
  citationMap: [number, number][],
): { delay: number; chunk: string; citations?: Citation[] }[] => {
  let cumulativeDelay = 0;
  return chunks.map((chunk, _idx) => {
    cumulativeDelay += Math.random() * 50 + 30;
    const matchingCitations = citationMap
      .filter(([pos]) => {
        const charIndex = chunks.slice(0, _idx + 1).join('').length;
        return Math.abs(charIndex / (chunks.join('').length) * 100 - pos) < 10;
      })
      .map(([, id]) => chapterCitations.find((c) => c.id === id))
      .filter(Boolean) as Citation[];

    return {
      delay: cumulativeDelay,
      chunk,
      ...(matchingCitations.length > 0 ? { citations: matchingCitations } : {}),
    };
  });
};

const ch1TokenChunks = buildCitationChunks(ch1Chunks, citations.ch1, [
  [15, 1],
  [16, 2],
  [40, 3],
  [80, 4],
]);

const ch2TokenChunks = buildCitationChunks(ch2Chunks, citations.ch2, [
  [20, 5],
  [40, 6],
  [60, 7],
]);

const ch3TokenChunks = buildCitationChunks(ch3Chunks, citations.ch3, [
  [20, 8],
  [35, 11],
  [60, 9],
  [85, 10],
]);

const ch4TokenChunks = buildCitationChunks(ch4Chunks, citations.ch4, [
  [15, 12],
  [40, 13],
  [80, 14],
]);

const ch5TokenChunks = buildCitationChunks(ch5Chunks, citations.ch5, [
  [15, 15],
  [16, 16],
  [60, 17],
  [85, 18],
]);

const followUpTokenChunks: { delay: number; chunk: string; citations?: Citation[] }[] = (() => {
  let cumulativeDelay = 0;
  return followUpChunks.map((chunk, _idx) => {
    cumulativeDelay += Math.random() * 50 + 30;
    const pos = (_idx / followUpChunks.length) * 100;
    let matchedCitations: Citation[] = [];
    if (pos > 55 && pos < 65) {
      matchedCitations = [followUpCitations[0]];
    } else if (pos > 80) {
      matchedCitations = [followUpCitations[0], followUpCitations[1]];
    }
    return {
      delay: cumulativeDelay,
      chunk,
      ...(matchedCitations.length > 0 ? { citations: matchedCitations } : {}),
    };
  });
})();

const subTasks: SubTask[] = [
  {
    id: 'st_1',
    title: '人工智能市场概览：规模与增速',
    query: '人工智能行业市场规模 增长趋势 全球市场 2024 2025',
    status: 'pending',
  },
  {
    id: 'st_2',
    title: '主要玩家分析：竞争格局与战略',
    query: 'OpenAI Google Anthropic AI竞争格局 市场份额 战略布局',
    status: 'pending',
  },
  {
    id: 'st_3',
    title: '核心技术路线：架构与创新',
    query: '大模型 Transformer MoE架构 多模态 RAG 技术路线 2024',
    status: 'pending',
  },
  {
    id: 'st_4',
    title: '融资动态：资本流向与热点',
    query: 'AI融资 风险投资 人工智能投资 2024 投融资趋势',
    status: 'pending',
  },
  {
    id: 'st_5',
    title: '未来趋势与监管：行业展望',
    query: 'AI监管政策 人工智能伦理 AGI发展 行业未来趋势 2025',
    status: 'pending',
  },
];

/**
 * Complete replay scenario definition.
 */
const replayScenario: ReplayScenario = {
  meta: {
    topic: '人工智能行业深度分析',
    totalDuration: 45000,
  },
  decompose: {
    delay: 500,
    data: subTasks,
  },
  searchEvents: [
    { delay: 800, data: { subTaskId: 'st_1', sourcesFound: 3 } },
    { delay: 1200, data: { subTaskId: 'st_2', sourcesFound: 2 } },
    { delay: 1500, data: { subTaskId: 'st_3', sourcesFound: 4 } },
    { delay: 1800, data: { subTaskId: 'st_4', sourcesFound: 3 } },
    { delay: 2000, data: { subTaskId: 'st_1', sourcesFound: 7 } },
    { delay: 2200, data: { subTaskId: 'st_5', sourcesFound: 5 } },
    { delay: 2500, data: { subTaskId: 'st_3', sourcesFound: 8 } },
    { delay: 2800, data: { subTaskId: 'st_2', sourcesFound: 6 } },
    { delay: 3200, data: { subTaskId: 'st_4', sourcesFound: 7 } },
    { delay: 3500, data: { subTaskId: 'st_5', sourcesFound: 9 } },
  ],
  chapterStreams: {
    ch_1: ch1TokenChunks,
    ch_2: ch2TokenChunks,
    ch_3: ch3TokenChunks,
    ch_4: ch4TokenChunks,
    ch_5: ch5TokenChunks,
  },
  followUpAnswers: {
    'ch_3_figure_vs_tesla': followUpTokenChunks,
  },
};

export default replayScenario;
