const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceRoot = path.resolve(root, "..", "..", "信号与系统", "signal_system_exam_review整理版");
const sourceData = path.join(sourceRoot, "structured_data", "signal_system_questions.json");
const targetAssets = path.join(root, "app", "src", "main", "assets");
const targetQuestions = path.join(targetAssets, "signal_system_questions.json");
const targetImageDir = path.join(targetAssets, "images", "signal_system");
const sourceImageDir = path.join(sourceRoot, "assets", "formulas");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeMathText(value) {
  if (value == null) return "";
  let text = String(value);
  const replacements = [
    [/\\omegat/g, "\\omega t"],
    [/\\pit/g, "\\pi t"],
    [/\\pmj/g, "\\pm j"],
    [/\\lambdaI/g, "\\lambda I"],
    [/\\operatorname\{rect\}/g, "\\mathrm{rect}"],
    [/e\^\(-\(t-1\)\)/g, "e^{-(t-1)}"],
    [/e\^\(-t\)/g, "e^{-t}"],
    [/e\^-t/g, "e^{-t}"],
    [/([^\w])x1([^\w])/g, "$1x_1$2"],
    [/([^\w])x2([^\w])/g, "$1x_2$2"],
    [/\bx1\b/g, "x_1"],
    [/\bx2\b/g, "x_2"],
    [/([0-9])x_?1/g, "$1x_1"],
    [/([0-9])x_?2/g, "$1x_2"],
    [/([^\w])uc([^\w])/g, "$1u_c$2"],
    [/([^\w])us([^\w])/g, "$1u_s$2"],
    [/\buc\b/g, "u_c"],
    [/\bus\b/g, "u_s"],
    [/([0-9.])uc/g, "$1u_c"],
    [/([0-9.])us/g, "$1u_s"],
    [/duc/g, "du_c"],
    [/([^\w])iL([^\w])/g, "$1i_L$2"],
    [/\biL\b/g, "i_L"],
    [/diL/g, "di_L"],
    [/\biC\b/g, "i_C"],
    [/([^\w])C1([^\w])/g, "$1C_1$2"],
    [/([^\w])C2([^\w])/g, "$1C_2$2"],
    [/([^\w])yss([^\w])/g, "$1y_{ss}$2"],
    [/([^\w])yh([^\w])/g, "$1y_h$2"],
    [/([^\w])yzi([^\w])/g, "$1y_{zi}$2"],
    [/([^\w])yzs([^\w])/g, "$1y_{zs}$2"],
    [/cos t/g, "\\cos t"],
    [/sin t/g, "\\sin t"],
    [/e\^\(-\(t-2\)\)/g, "e^{-(t-2)}"],
    [/e\^\(-([a-zA-Z0-9+\-]+)\)/g, "e^{-$1}"],
    [/Φ\(t\)/g, "\\Phi(t)"],
    [/\\lvert \\lambda I-A \\rvert/g, "\\lvert \\lambda I-A \\rvert"],
    [/s=\(-3\\pm j\\sqrt\{7\}\/2/g, "s=\\frac{-3\\pm j\\sqrt{7}}{2}"],
    [/2×100=200Hz/g, "2\\times 100=200\\text{Hz}"],
  ];
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

function stripInaccessibleImageNotes(value) {
  return normalizeMathText(value)
    .replace(/^参数图片见：`assets\/formulas\/image41\.jpeg` 至 `assets\/formulas\/image48\.png`。\n\n/m, "")
    .replace(/^电路图见：`assets\/formulas\/image40\.png`\n\n/m, "")
    .replace(/^框图见：`assets\/formulas\/image49\.png`\n\n/m, "");
}

function optionTable(q) {
  if (!Array.isArray(q.optionExplanations) || q.optionExplanations.length === 0) return "";
  const rows = q.optionExplanations.map((item) => {
    return `| ${item.key} | ${normalizeMathText(item.optionText || item.value || "")} | ${item.judgment || ""} | ${normalizeMathText(item.reason || "")} |`;
  });
  return [
    "### 选项辨析",
    "",
    "| 选项 | 内容 | 结论 | 理由 |",
    "|---|---|---|---|",
    ...rows,
  ].join("\n");
}

function polishedKnowledgeDetail(q) {
  const base = normalizeMathText(q.knowledgeDetail || "");
  if (q.type === "single_choice") {
    const table = optionTable(q);
    const special = q.examAssumption ? `\n\n### 考试口径提醒\n\n${normalizeMathText(q.examAssumption)}` : "";
    return [base, table, special].filter(Boolean).join("\n\n").trim();
  }
  return base;
}

function essayAnswer(q) {
  return stripInaccessibleImageNotes(q.answer || q.finalAnswer || "");
}

const ESSAY_ANSWER_OVERRIDES = {
  24: `采样定理指出，若连续信号的最高频率为 $f_m$，为了使采样后的数字信号能够无失真恢复原连续信号，采样频率必须满足：

$$
f_s \ge 2f_m
$$

这里的 $2f_m$ 称为奈奎斯特采样频率。

采样频率选择会直接影响数字通信质量：

1. 采样频率过低：频谱复制后会发生重叠，高频分量折叠到低频，产生混叠失真。接收端即使再做重建，也无法还原原来的语音或数据。
2. 采样频率合适：既能保留信号主要信息，又能控制数据量、带宽和处理成本。
3. 采样频率过高：失真会更小，但会带来更大的码率、更高存储量和更高传输带宽，不一定经济。

以语音通信为例，电话语音常取有效频率范围约为 300Hz 到 3.4kHz，因此最高频率可按 $f_m=3.4kHz$ 估计。理论最低采样频率为：

$$
f_s \ge 2\times 3.4kHz = 6.8kHz
$$

工程中通常取 $8kHz$，这样既满足采样定理，又留出一定保护带，便于实际滤波器实现。考试作答时要写清：采样频率不是越高越好，而是在防止混叠和控制资源开销之间折中。`,
  25: `连续时间自动控制系统的稳定性可以通过系统函数 $H(s)$ 的极点分布判断。系统函数的极点就是分母方程的根，它们决定系统自然响应是否会衰减。

稳定性判断口径如下：

1. 若全部极点都在 $s$ 平面的左半平面，即极点实部均小于 0，则自然响应随时间衰减，系统稳定。
2. 若存在极点在右半平面，即极点实部大于 0，则响应含增长指数项，系统不稳定。
3. 若极点在虚轴上，要进一步判断。单纯虚轴单极点可能产生等幅振荡；重复虚轴极点通常会导致响应增长，不能简单判为稳定。

工程上必须保证控制系统稳定，因为控制系统的输出通常对应真实物理量，如温度、转速、电压、液位等。不稳定系统会使输出持续振荡或发散，轻则控制效果差，重则损坏设备或引发安全事故。

例如温度控制系统若稳定，室温会逐渐接近设定温度；若不稳定，可能出现频繁加热/制冷、温度大幅波动。电机转速控制若不稳定，转速可能持续振荡甚至超速。因此实际设计中常通过调节参数、增加阻尼或补偿网络，把闭环极点配置到左半平面。`,
  29: `傅里叶变换的核心作用，是把时域里“随时间变化的波形”换成频域里“各个频率成分的分布”。也就是说，原来在波形上混在一起的音频、噪声、干扰，经过傅里叶变换后会变成频谱上的不同频率成分。

结合蓝牙音频传输来看：

1. 蓝牙传输的有效内容主要是语音或音乐。语音、音乐虽然时域波形复杂，但它们的主要能量集中在有限的音频频段内。
2. 外界电磁干扰或高频噪声往往落在音频有效频段之外，或者表现为频谱中异常的高频分量、尖峰分量。
3. 对接收信号做傅里叶变换后，可以观察频谱：音频信号对应需要保留的频率范围，高频干扰对应需要抑制的频率范围。
4. 工程上再配合低通、带通或陷波滤波器，保留语音/音乐所在频段，衰减高频干扰，就能改善蓝牙音频的清晰度。

考试作答时要抓住一句话：傅里叶变换不是直接“消除噪声”，而是先把信号展开到频域，让有效音频和干扰在频谱上可区分，然后再用滤波器处理。`,
  30: `傅里叶变换的物理意义，是把一个时域信号分解成许多不同频率正弦分量的叠加，从而看清信号“含有哪些频率、各频率强弱是多少”。它相当于给信号做频谱检查。

用于无人机遥控通信时，可以这样理解：

1. 遥控指令信号通常工作在规定通信频段内，频谱位置比较明确。
2. 环境干扰可能来自电机、电磁噪声、其他无线设备，频率位置可能不同，也可能呈现宽带噪声。
3. 将接收端混合信号做傅里叶变换后，遥控指令会在目标频段形成主要频谱分量；干扰则可能出现在其他频段，或表现为不稳定的杂散峰、宽带底噪。
4. 接收机根据频谱位置和幅度筛选目标频段，滤除非目标频段，就能提高遥控指令识别的可靠性。

考试要点：先写“时域转频域、显示频率组成”，再写“遥控信号在指定频段，干扰在其他频段或呈宽带噪声”，最后写“按频段滤波/判别”。`,
};

const ESSAY_KNOWLEDGE_OVERRIDES = {
  23: `核心知识框架：
- 题目中心：用 LTI 的两条性质解释音频滤波为什么可靠。
- 线性：输入是“人声 + 背景噪声 + 音乐”时，输出可以看成各部分分别滤波后的叠加，不会因为混合输入而乱出额外成分。
- 时不变：同一个滤波器今天和明天规则一致，同样频率的人声会被同样保留，同样频率的噪声会被同样衰减。

关系梳理：
| 性质 | 在公式里 | 在音频滤波里 |
|---|---|---|
| 线性 | $a x_1+b x_2 \\rightarrow a y_1+b y_2$ | 人声和噪声可分开理解，不会互相“变形”成新规则 |
| 时不变 | 输入延迟，输出同样延迟 | 滤波效果稳定，不会一会儿强一会儿弱 |
| 频率选择 | 不同频段增益不同 | 保留人声频段，压低噪声频段 |

作答抓手：先定义 LTI，再把“线性=可叠加处理”，“时不变=规则稳定”翻译到音频场景，最后举带通/陷波例子。`,
  24: `核心知识框架：
- 题目中心：卷积描述 LTI 系统的输入输出关系。
- 对 LTI 系统，只要知道冲激响应 $h(t)$，任意输入 $x(t)$ 的零状态响应都可以由 $y(t)=x(t)*h(t)$ 求出。
- 卷积的物理意思：把输入分解成很多延迟冲激，每个冲激经过系统变成延迟后的冲激响应，最后全部叠加。

关系梳理：
| 名词 | 含义 | 做题时怎么用 |
|---|---|---|
| 冲激响应 $h(t)$ | 系统对单位冲激的输出 | 代表系统本身特性 |
| 卷积 $x*h$ | 输入各瞬间作用的叠加 | 直接求零状态响应 |
| LTI | 线性 + 时不变 | 让“分解、延迟、叠加”成立 |

作答抓手：卷积题不要只背公式，要说明“冲激响应是系统指纹，卷积是输入经过系统后的叠加结果”。`,
  25: `核心知识框架：
- 题目中心：冲激响应与系统性质之间的关系。
- 对连续时间 LTI 系统，冲激响应 $h(t)$ 可以判断因果性、稳定性，也能和频率响应/系统函数相连。
- 因果判断看 $h(t)$ 是否在 $t<0$ 为 0；稳定判断看 $\\int_{-\\infty}^{\\infty}|h(t)|dt$ 是否有限。

关系梳理：
| 判断对象 | 看什么 | 结论口径 |
|---|---|---|
| 因果性 | $h(t)=0,\\ t<0$ | 输出不提前依赖未来输入 |
| BIBO 稳定 | $\\int |h(t)|dt<\\infty$ | 有界输入得到有界输出 |
| 频率响应 | $H(j\\omega)=\\mathcal{F}\\{h(t)\\}$ | 看系统对各频率的放大/衰减 |

作答抓手：凡是问 LTI 系统性质，先把问题落回 $h(t)$。`,
  26: `核心知识框架：
- 题目中心：傅里叶级数用于周期信号，傅里叶变换用于非周期信号或一般频谱分析。
- 周期信号频谱是离散谱，非周期信号频谱通常是连续谱。
- 考试常把“周期/非周期”和“级数/变换”配对考。

关系梳理：
| 对象 | 工具 | 频谱形态 |
|---|---|---|
| 周期信号 | 傅里叶级数 | 离散谱线 |
| 非周期信号 | 傅里叶变换 | 连续频谱 |
| 采样后的频谱 | 频谱周期复制 | 注意混叠 |

作答抓手：看到“周期展开”写级数；看到“时域转频域、频谱函数”写变换。`,
  27: `核心知识框架：
- 题目中心：用频谱理解滤波器。
- 滤波器的本质是对不同频率给不同增益：要的频率保留，不要的频率衰减。
- 低通、带通、高通、陷波的区别，只在“通带/阻带位置”不同。

关系梳理：
| 滤波器 | 保留 | 抑制 | 常见场景 |
|---|---|---|---|
| 低通 | 低频 | 高频 | 去高频毛刺、平滑 |
| 高通 | 高频 | 低频 | 去直流漂移 |
| 带通 | 某一频段 | 频段外 | 语音/通信频段提取 |
| 陷波 | 大部分频段 | 某个窄频点 | 去 50Hz 工频干扰 |

作答抓手：先说频域分离，再说用对应滤波器保留目标频段。`,
  28: `核心知识框架：
- 题目中心：傅里叶变换为什么能用于图像、音频、通信等工程问题。
- 共同逻辑都是“复杂波形/数据可以分解为频率成分”，再根据频率成分做识别、压缩、滤波或增强。

关系梳理：
| 应用 | 频域里看什么 | 工程动作 |
|---|---|---|
| 音频 | 音调、噪声频段 | 降噪、均衡 |
| 通信 | 载波频率、带宽 | 调制、滤波 |
| 图像 | 低频轮廓、高频边缘 | 压缩、锐化、去噪 |

作答抓手：不要把傅里叶写成抽象公式堆；要写出“分解频率 -> 看频谱 -> 按频率处理”。`,
  29: `核心知识框架：
- 题目中心：蓝牙音频里，傅里叶变换负责“看清频谱”，滤波器负责“处理频谱”。
- 音频有效成分主要落在音频频段，外界高频干扰常落在更高频段或表现为异常频谱峰。
- 频域能把时域混在一起的音频和干扰分开看，这是本题最核心的理由。

辨析表：
| 项目 | 时域看到的样子 | 频域看到的样子 | 处理方法 |
|---|---|---|---|
| 有效音频 | 复杂波形 | 音频范围内的主要能量 | 保留 |
| 高频干扰 | 叠在波形上的毛刺/抖动 | 高频区异常成分 | 衰减 |
| 傅里叶变换 | 不直接滤波 | 负责暴露频率组成 | 为滤波提供依据 |

作答抓手：本题不是问蓝牙协议细节，而是问“频域如何区分有效音频与高频干扰”。`,
  30: `核心知识框架：
- 题目中心：无人机遥控信号能通过频谱位置与环境干扰区分。
- 遥控指令通常有指定通信频段；干扰可能在其他频段，也可能表现为宽带噪声。
- 傅里叶变换把混合接收信号变成频谱后，就可以按频段筛选目标信号。

辨析表：
| 成分 | 频谱特征 | 判断依据 | 处理 |
|---|---|---|---|
| 遥控指令 | 目标频段内较稳定分量 | 符合通信频段 | 保留/解调 |
| 窄带干扰 | 非目标频段尖峰 | 频率位置不匹配 | 滤除 |
| 宽带噪声 | 多频段底噪升高 | 没有稳定目标峰 | 抑制 |

作答抓手：先说傅里叶变换的物理意义，再说“指定频段”和“环境干扰频段”的差异。`,
  31: `核心知识框架：
- 题目中心：采样定理防止混叠。
- 若连续信号最高频率为 $f_m$，采样频率必须满足 $f_s\\ge 2f_m$。
- 低于奈奎斯特频率时，高频会折叠到低频，恢复时会把假频率当真信号。

关系梳理：
| 概念 | 含义 | 易错点 |
|---|---|---|
| 最高频率 $f_m$ | 原信号最大有效频率 | 注意角频率要除以 $2\\pi$ |
| 奈奎斯特频率 | 最低采样频率 $2f_m$ | 不是 $f_m$ 本身 |
| 混叠 | 频谱复制后重叠 | 采样前常加抗混叠低通 |

作答抓手：采样题先找最高频率，再翻倍；如果题目给角频率，要换成 Hz。`,
  32: `核心知识框架：
- 题目中心：拉普拉斯变换把微分方程变成代数方程。
- 连续系统分析中，$s$ 域可以同时处理暂态、稳态、系统函数、极点和稳定性。
- 系统函数 $H(s)$ 的极点决定自然响应形式，也决定稳定性。

关系梳理：
| 时域问题 | s 域对应 | 做题收益 |
|---|---|---|
| 微分 | 乘以 $s$ | 微分方程变代数方程 |
| 卷积 | 相乘 | 输入输出计算更快 |
| 系统稳定 | 极点位置 | 左半平面稳定 |
| 响应形式 | 极点类型 | 指数/振荡/衰减振荡 |

作答抓手：写清“拉普拉斯不是只求积分，它是为了把系统问题搬到 s 域看极点”。`,
  33: `核心知识框架：
- 题目中心：连续 LTI 系统稳定性看极点。
- 因果连续系统 BIBO 稳定的常用判据：系统函数全部极点都在左半平面。
- 极点在右半平面会指数增长；在虚轴上通常不能按 BIBO 稳定处理。

关系梳理：
| 极点位置 | 响应形态 | 稳定性 |
|---|---|---|
| 左半平面 | 衰减指数/衰减振荡 | 稳定 |
| 虚轴 | 等幅振荡或不衰减 | 通常不 BIBO 稳定 |
| 右半平面 | 指数增长 | 不稳定 |

作答抓手：看到 $H(s)$，先找分母根；根的位置比展开时域更快。`,
  34: `核心知识框架：
- 题目中心：Z 变换是离散时间系统里的“拉普拉斯变换对应物”。
- 离散系统用 $z$ 域分析差分方程、系统函数、极点和稳定性。
- 因果离散系统稳定常用判据：全部极点位于单位圆内。

关系梳理：
| 连续系统 | 离散系统 |
|---|---|
| 拉普拉斯变换 $s$ 域 | Z 变换 $z$ 域 |
| 微分方程 | 差分方程 |
| 左半平面稳定 | 单位圆内稳定 |
| $e^{st}$ | $z^n$ |

作答抓手：离散题看到 $z$，就把“左半平面”换成“单位圆内”。`,
  35: `核心知识框架：
- 题目中心：离散系统稳定性与 ROC/极点位置有关。
- 对因果离散 LTI 系统，ROC 在最外极点之外；若单位圆包含在 ROC 内，则系统稳定。
- 常见简化：因果有理系统全部极点模长小于 1，则稳定。

关系梳理：
| 条件 | 判据 | 结论 |
|---|---|---|
| 因果系统 | ROC 在最外极点外 | 看最大极点模 |
| 稳定系统 | ROC 包含单位圆 | $|z|=1$ 要在 ROC 内 |
| 因果且稳定 | 极点全在单位圆内 | 最常考 |

作答抓手：不要只说“看极点”，要补一句“因果系统稳定要求极点在单位圆内”。`,
  36: `核心知识框架：
- 题目中心：RC/RLC 电路可以等效为系统函数。
- 电阻、电感、电容在 $s$ 域分别用 $R$、$sL$、$1/(sC)$ 表示。
- 输出取在哪个元件上，就用分压关系求对应的 $H(s)$。

关系梳理：
| 元件 | s 域阻抗 | 常见作用 |
|---|---|---|
| 电阻 | $R$ | 阻尼、耗能 |
| 电感 | $sL$ | 高频阻抗大 |
| 电容 | $1/(sC)$ | 低频阻抗大 |
| 串联输出 | 分压 | $H(s)=Z_{out}/Z_{total}$ |

作答抓手：电路题先画 s 域阻抗，再看输出位置，最后由分母极点判断稳定。`,
  37: `核心知识框架：
- 题目中心：二阶系统响应、方框图和状态空间是同一个系统的三种表达。
- $H(s)=12/(s^2+7s+12)$ 的分母给出自然模态，极点为 $-3,-4$，所以暂态会衰减。
- 阶跃输入 $2u(t)$ 的稳态值可用终值定理或直流增益：$H(0)\\times 2=1\\times2=2$。

关系梳理：
| 表达方式 | 本题对应 | 用途 |
|---|---|---|
| 传递函数 | $12/(s^2+7s+12)$ | 求零状态响应 |
| 微分方程 | $y''+7y'+12y=12f$ | 画积分器方框图 |
| 状态空间 | $x_1=y, x_2=y'$ | 看特征值和稳定性 |

作答抓手：先部分分式求 $y(t)$，再用分母根说明稳定；方框图不会画时写清“两个积分器 + 反馈系数”。`,
  38: `核心知识框架：
- 题目中心：RLC 串联电路输出电容电压，先用 s 域分压求系统函数，再反变换求响应。
- 本题 $Z_C=4/s$，所以 $H(s)=4/(s^2+3s+4)$。
- 极点为 $(-3\\pm j\\sqrt7)/2$，实部为负，说明响应是衰减振荡并且系统稳定。

关系梳理：
| 分问 | 关键动作 | 本题结果 |
|---|---|---|
| 求 $H(s)$ | 电容阻抗 / 总阻抗 | $4/(s^2+3s+4)$ |
| 求 $u_c(t)$ | $10/s$ 乘 $H(s)$ 后反变换 | 稳态 10V + 衰减振荡暂态 |
| 状态空间 | 取 $x_1=u_c, x_2=i_L$ | $x_1'=4x_2, x_2'=u_s-3x_2-x_1$ |
| 稳定性 | 看特征根实部 | 实部 $-3/2$，稳定 |

作答抓手：串联电路输出电容电压就想“电容分压”；状态变量优先选电容电压和电感电流。`,
  39: `核心知识框架：
- 题目中心：带初始状态的 RLC 要求全响应，而不只是零状态响应。
- 选 $x_1=u_C, x_2=i_L$ 后，电容关系给 $x_1'=2x_2$，电感 KVL 给 $x_2'=e(t)-2x_2-x_1$。
- 初始电容电压直接给 $y(0)$，初始电感电流通过 $y'(0)=x_1'(0)=2x_2(0)$ 给导数初值。

关系梳理：
| 信息 | 转成数学条件 |
|---|---|
| $u_C(0)=2$ | $y(0)=2$ |
| $i_L(0)=1$ | $y'(0)=2$ |
| 单位阶跃输入 | 稳态满足 $2y=2$，所以 $y_{ss}=1$ |
| 极点 $-1\\pm j$ | 衰减振荡项 $e^{-t}(C_1\\cos t+C_2\\sin t)$ |

作答抓手：全响应 = 稳态 + 由初值决定的暂态；不要把初始电流漏掉。`,
  40: `核心知识框架：
- 题目中心：从框图写状态空间，核心是“积分器输入 = 状态导数，积分器输出 = 状态变量”。
- 本题第一个积分器输出 $x_1$，第二个积分器输出 $x_2$；加法器关系直接给 $x_1'=f(t)-3x_1-2x_2$，第二个积分器输入来自 $x_1$，所以 $x_2'=x_1$。
- 零输入响应只看初始状态；零状态响应只看输入，两者最后可以叠加。

关系梳理：
| 任务 | 看哪里 | 本题结论 |
|---|---|---|
| 状态方程 | 积分器输入端 | $x_1'=f-3x_1-2x_2, x_2'=x_1$ |
| 输出方程 | 输出加法器 | $y=x_1+x_2$ |
| 特征根 | $|\\lambda I-A|=0$ | $-1,-2$ |
| 零输入 | 初值 $x_1(0),x_2(0)$ | $y_{zi}=2e^{-2t}$ |
| 零状态 | 传递函数 | $Y_{zs}(s)=F(s)/(s+2)$ |

作答抓手：框图题不要先猜传递函数，先逐个积分器写状态方程。`,
};

const ESSAY_ANSWER_REVIEWED_OVERRIDES = {
  24: `采样定理指出，若连续信号的最高频率为 $f_m$，为了使采样后的数字信号能够无失真恢复原连续信号，采样频率必须满足：

$$
f_s \\ge 2f_m
$$

这里的 $2f_m$ 称为奈奎斯特采样频率。

采样频率选择会直接影响数字通信质量：

1. 采样频率过低：频谱复制后会发生重叠，高频分量折叠到低频，产生混叠失真。接收端即使再做重建，也无法还原原来的语音或数据。
2. 采样频率合适：既能保留信号主要信息，又能控制数据量、带宽和处理成本。
3. 采样频率过高：失真会更小，但会带来更大的码率、更高存储量和更高传输带宽，不一定经济。

以语音通信为例，电话语音常取有效频率范围约为 300Hz 到 3.4kHz，因此最高频率可按 $f_m=3.4kHz$ 估计。理论最低采样频率为：

$$
f_s \\ge 2\\times 3.4kHz = 6.8kHz
$$

工程中通常取 $8kHz$，这样既满足采样定理，又留出一定保护带，便于实际滤波器实现。考试作答时要写清：采样频率不是越高越好，而是在防止混叠和控制资源开销之间折中。`,
  25: `连续时间自动控制系统的稳定性可以通过系统函数 $H(s)$ 的极点分布判断。系统函数的极点就是分母方程的根，它们决定系统自然响应是否会衰减。

稳定性判断口径如下：

1. 若全部极点都在 $s$ 平面的左半平面，即极点实部均小于 0，则自然响应随时间衰减，系统稳定。
2. 若存在极点在右半平面，即极点实部大于 0，则响应含增长指数项，系统不稳定。
3. 若极点在虚轴上，要进一步判断。单纯虚轴单极点可能产生等幅振荡；重复虚轴极点通常会导致响应增长，不能简单判为稳定。

工程上必须保证控制系统稳定，因为控制系统的输出通常对应真实物理量，如温度、转速、电压、液位等。不稳定系统会使输出持续振荡或发散，轻则控制效果差，重则损坏设备或引发安全事故。

例如温度控制系统若稳定，室温会逐渐接近设定温度；若不稳定，可能出现频繁加热/制冷、温度大幅波动。电机转速控制若不稳定，转速可能持续振荡甚至超速。因此实际设计中常通过调节参数、增加阻尼或补偿网络，把闭环极点配置到左半平面。`,
};

const ESSAY_KNOWLEDGE_REVIEWED_OVERRIDES = {
  24: `核心知识框架：
- 题目中心：采样频率如何影响数字通信质量。
- 采样定理给底线：$f_s \\ge 2f_m$，低于这个值会混叠，恢复不出原信号。
- 工程取值不是越高越好，而是在“防混叠”和“码率/带宽/功耗成本”之间折中。

关系梳理：
| 采样频率选择 | 后果 | 语音通信例子 |
|---|---|---|
| 太低 | 频谱混叠，语音失真 | 低于 6.8kHz 不可靠 |
| 合理 | 可恢复且成本可控 | 常用 8kHz |
| 太高 | 数据量和带宽增加 | 质量提升有限但成本上升 |

作答抓手：先写 $2f_m$，再写混叠，最后用 3.4kHz 语音推出 8kHz 工程采样。`,
  25: `核心知识框架：
- 题目中心：用系统函数极点判断控制系统稳定性。
- 连续因果系统常用判断：极点全部在左半平面，响应会衰减，系统稳定。
- 工程意义：稳定不是抽象数学要求，而是保证温度、转速、电压等物理量不会振荡失控。

关系梳理：
| 极点位置 | 响应表现 | 工程后果 |
|---|---|---|
| 左半平面 | 暂态衰减 | 输出逐渐接近设定值 |
| 虚轴 | 不衰减振荡风险 | 可能持续摆动 |
| 右半平面 | 指数发散 | 设备失控或损坏 |

作答抓手：先说“极点实部”，再联系控制对象的安全性和可靠性。`,
  26: `核心知识框架：
- 题目中心：AM 调幅信号的频谱分析。
- 傅里叶变换把时域通信信号展开为频率成分，从而看清载波和边带。
- AM 的低频调制信号会被搬移到载波附近，形成上边带和下边带。

关系梳理：
| 成分 | 时域来源 | 频域位置 |
|---|---|---|
| 载波 | $\\cos(\\omega_c t)$ | $\\pm\\omega_c$ 附近 |
| 调制信号 | $m(t)$ | 原本在低频 |
| 边带 | 调制乘载波 | $\\omega_c\\pm\\omega_m$ |

作答抓手：写清“频谱峰值看载波，载波两侧看调制信息，带宽由边带范围决定”。`,
  27: `核心知识框架：
- 题目中心：数字滤波器为什么要求 LTI，以及不满足时会怎样失真。
- 线性保证多个频率分量可分别处理再叠加；时不变保证同一滤波规则不随时间漂移。
- 非线性会产生新谐波/互调，时变会导致音量、音色或频率响应随时间晃动。

辨析表：
| 性质 | 满足时 | 不满足时 |
|---|---|---|
| 线性 | 人声、噪声、伴奏可按叠加分析 | 产生谐波和互调失真 |
| 时不变 | 同一声音片段处理规则稳定 | 音色忽明忽暗、参数漂移 |
| LTI | 可用频率响应设计滤波器 | 频域设计口径失效 |

作答抓手：这题不是单纯定义题，要把叠加性和时不变性落到“音频失真”上。`,
  28: `核心知识框架：
- 题目中心：模拟处理和数字处理在手机语音模块中的对比。
- 模拟处理功耗低、结构直接，但抗干扰和升级能力弱；数字处理功耗较高，但算法灵活、抗干扰强。
- 语音降噪体现数字处理优势：可以按环境噪声动态估计和更新算法。

对比表：
| 维度 | 模拟处理 | 数字处理 |
|---|---|---|
| 功耗 | 电路简单，通常较低 | A/D、处理器运算，较高 |
| 抗干扰 | 噪声直接叠加 | 可滤波、编码、纠错 |
| 升级 | 改硬件才方便 | 软件/固件可升级 |
| 降噪 | 固定电路参数 | 自适应滤波、谱减、AI 降噪 |

作答抓手：按三个小问逐项对比，再用“语音降噪算法可更新”收束。`,
  31: `核心知识框架：
- 题目中心：RC 低通输入矩形脉冲时，用卷积求零状态响应。
- 输入 $f(t)=u(t)-u(t-1)$ 可以看作两个阶跃相减，所以输出等于两个阶跃响应相减。
- $h(t)=e^{-t}u(t)$ 的阶跃响应是 $(1-e^{-t})u(t)$。

关系梳理：
| 对象 | 本题表达 | 作用 |
|---|---|---|
| 冲激响应 | $h(t)=e^{-t}u(t)$ | 系统特性 |
| 输入脉冲 | $u(t)-u(t-1)$ | 宽度 1 秒 |
| 输出 | 阶跃响应相减 | 形成先上升后衰减 |

作答抓手：矩形脉冲卷积题，优先拆成“阶跃 - 延迟阶跃”。`,
  32: `核心知识框架：
- 题目中心：矩形脉冲的傅里叶变换、低通滤波和时移幅度变化。
- $\\mathrm{rect}(t/2)$ 的有效宽度为 2，频谱呈 sinc 型：$2\\sin\\omega/\\omega$。
- 理想低通只保留 $|\\omega|<2\\pi$ 的频率；延迟会给频谱乘相位因子，幅度放大会整体放大频谱。

关系梳理：
| 操作 | 时域表现 | 频域表现 |
|---|---|---|
| 矩形脉冲 | 有限时间窗 | sinc 频谱 |
| 低通滤波 | 波形变平滑 | 截掉高频 |
| 延迟 $t_0$ | 波形右移 | 乘 $e^{-j\\omega t_0}$ |
| 放大 3 倍 | 幅度变 3 倍 | 频谱幅度变 3 倍 |

作答抓手：第 1 问算积分，第 2 问写 $Y=HX$，第 3 问分别说时移和幅度缩放。`,
  33: `核心知识框架：
- 题目中心：RC 低通的系统函数、ROC、矩形脉冲响应和阶跃过渡。
- $h(t)=e^{-t}u(t)$ 对应 $H(s)=1/(s+1)$，因果 ROC 是 $\\operatorname{Re}(s)>-1$。
- 输入 $u(t)-u(t-2)$ 时，仍然用“阶跃响应 - 延迟阶跃响应”。

关系梳理：
| 分问 | 关键公式 | 本题意义 |
|---|---|---|
| $H(s)$ | $1/(s+1)$ | 一阶低通 |
| ROC | $\\operatorname{Re}(s)>-1$ | 因果右边信号 |
| 矩形输入 | 两个阶跃相减 | 先充电后放电 |
| 10V 阶跃 | $10(1-e^{-t})u(t)$ | 稳态 10V |

作答抓手：RC 低通就是一阶惯性系统，过渡过程按指数逐渐接近稳态。`,
  34: `核心知识框架：
- 题目中心：有限长离散序列的 Z 变换和通过系统后的零状态响应。
- $\\delta[k-n] \\leftrightarrow z^{-n}$，所以 $2\\delta[k]+3\\delta[k-1]$ 直接写成 $2+3z^{-1}$。
- 有限长序列的 ROC 通常排除使表达式无意义的点，本题含 $z^{-1}$，所以排除 $z=0$。

关系梳理：
| 内容 | 结果 | 理由 |
|---|---|---|
| 输入 Z 变换 | $2+3z^{-1}$ | 冲激移位 |
| 输入 ROC | $0<|z|<\\infty$ | 含负幂，排除 0 |
| 系统函数 | $1/(1-0.5z^{-1})$ | 一阶因果系统 |
| 输出 | $Y=XH$ | Z 域相乘 |

作答抓手：先算 $F(z)$，再乘 $H(z)$；ROC 要取二者共同满足并考虑系统极点。`,
  35: `核心知识框架：
- 题目中心：有限冲激响应 FIR 系统的 Z 变换、因果性和稳定性。
- $h[k]$ 只在有限几个非负时刻非零，所以系统因果且绝对可和。
- FIR 系统没有无限长尾巴，通常稳定；本题 $\sum |h[k]|=8<\\infty$。

关系梳理：
| 判断 | 本题依据 | 结论 |
|---|---|---|
| Z 变换 | $-3+5z^{-2}$ | 两个冲激项 |
| ROC | $0<|z|<\\infty$ | 含 $z^{-2}$ |
| 因果性 | $k<0$ 无冲激 | 因果 |
| 稳定性 | 绝对值和有限 | 稳定 |

作答抓手：看到有限个冲激，先想到 FIR；因果看是否有负时刻，稳定看绝对可和。`,
  36: `核心知识框架：
- 题目中心：一阶差分系统的系统函数、稳定性和指数输入响应。
- 差分方程 $y[k]-0.5y[k-1]=f[k]$ 转到 Z 域后得到 $H(z)=1/(1-0.5z^{-1})$。
- 极点 $0.5$ 在单位圆内，所以因果系统稳定；对温度数据表现为平滑器。

关系梳理：
| 分问 | 关键点 | 本题结论 |
|---|---|---|
| 系统函数 | 差分方程取 Z 变换 | $1/(1-0.5z^{-1})$ |
| ROC | 因果右边序列 | $|z|>0.5$ |
| 稳定 | 极点在单位圆内 | 稳定 |
| 平滑 | 当前值叠加历史输出 | 抑制快速噪声波动 |

作答抓手：离散一阶系统先找极点，再说明“历史输出反馈让温度曲线更平滑”。`,
};

function refineEssayAnswer(q, text) {
  let refined = ESSAY_ANSWER_REVIEWED_OVERRIDES[q.number] || ESSAY_ANSWER_OVERRIDES[q.number] || text;
  if (q.number === 37) {
    refined = refined
      .replace("$2-8e^{-3}t+6e^{-4}t$", "$2-8e^{-3t}+6e^{-4t}$")
      .replace(`$$
\\begin{aligned}
[x_1'] [ 0 1][x_1] [ 0]f \\\\
[x_2'] &= [-12 -7][x_2] + [12] \\\\
y&=[1 0][x_1 x_2]^{T}
\\end{aligned}
$$`, `$$
\\begin{bmatrix}x_1'\\\\x_2'\\end{bmatrix}
=
\\begin{bmatrix}0&1\\\\-12&-7\\end{bmatrix}
\\begin{bmatrix}x_1\\\\x_2\\end{bmatrix}
+
\\begin{bmatrix}0\\\\12\\end{bmatrix}f(t),
\\quad
y=\\begin{bmatrix}1&0\\end{bmatrix}
\\begin{bmatrix}x_1\\\\x_2\\end{bmatrix}
$$`);
  }
  if (q.number === 38) {
    refined = refined.replace(`$$
\\begin{aligned}
[x_1'] [ 0 4][x_1] [0]u_s \\\\
[x_2'] &= [-1 -3][x_2] + [1] \\\\
y&=[1 0][x_1 x_2]^{T}
\\end{aligned}
$$`, `$$
\\begin{bmatrix}x_1'\\\\x_2'\\end{bmatrix}
=
\\begin{bmatrix}0&4\\\\-1&-3\\end{bmatrix}
\\begin{bmatrix}x_1\\\\x_2\\end{bmatrix}
+
\\begin{bmatrix}0\\\\1\\end{bmatrix}u_s,
\\quad
y=\\begin{bmatrix}1&0\\end{bmatrix}
\\begin{bmatrix}x_1\\\\x_2\\end{bmatrix}
$$`);
  }
  if (q.number === 39) {
    refined = refined
      .replace(/Lx2'/g, "Lx_2'")
      .replace(/Rx2/g, "R x_2")
      .replace("A=[0 2; -1 -2]", "A=\\begin{bmatrix}0&2\\\\-1&-2\\end{bmatrix}")
      .replace(`$$
\\begin{aligned}
[x_1'] [ 0 2][x_1] [0]e(t) \\\\
[x_2'] &= [-1 -2][x_2] + [1] \\\\
y&=[1 0][x_1 x_2]^{T}
\\end{aligned}
$$`, `$$
\\begin{bmatrix}x_1'\\\\x_2'\\end{bmatrix}
=
\\begin{bmatrix}0&2\\\\-1&-2\\end{bmatrix}
\\begin{bmatrix}x_1\\\\x_2\\end{bmatrix}
+
\\begin{bmatrix}0\\\\1\\end{bmatrix}e(t),
\\quad
y=\\begin{bmatrix}1&0\\end{bmatrix}
\\begin{bmatrix}x_1\\\\x_2\\end{bmatrix}
$$`)
      .replace(`$$
\\begin{aligned}
\\Phi(t)&=e^{-t} [ \\cos t+\\sin t 2\\sin t \\\\
-\\sin t \\cos t-\\sin t ]
\\end{aligned}
$$`, `$$
\\Phi(t)=e^{-t}
\\begin{bmatrix}
\\cos t+\\sin t & 2\\sin t\\\\
-\\sin t & \\cos t-\\sin t
\\end{bmatrix}
$$`);
  }
  if (q.number === 40) {
    refined = refined
      .replace(/\\lambda1/g, "\\lambda_1")
      .replace(/\\lambda2/g, "\\lambda_2")
      .replace(/lambda1/g, "\\lambda_1")
      .replace(/lambda2/g, "\\lambda_2")
      .replace(/\\bX1\\b/g, "X_1")
      .replace(/\\bX2\\b/g, "X_2")
      .replace(/\\bYzs\\b/g, "Y_{zs}")
      .replace(`$$
\\begin{aligned}
[x_1'] [-3 -2][x_1] [1]f(t) \\\\
[x_2'] &= [ 1 0][x_2] + [0] \\\\
y&=[1 1][x_1 x_2]^{T}
\\end{aligned}
$$`, `$$
\\begin{bmatrix}x_1'\\\\x_2'\\end{bmatrix}
=
\\begin{bmatrix}-3&-2\\\\1&0\\end{bmatrix}
\\begin{bmatrix}x_1\\\\x_2\\end{bmatrix}
+
\\begin{bmatrix}1\\\\0\\end{bmatrix}f(t),
\\quad
y=\\begin{bmatrix}1&1\\end{bmatrix}
\\begin{bmatrix}x_1\\\\x_2\\end{bmatrix}
$$`);
  }
  refined = refined.replace(/\r?\n\$\r?\n([\s\S]*?)\r?\n\$\r?\n/g, (match, body) => {
    return body.includes("\\begin{bmatrix}") ? `\n$$\n${body}\n$$` : match;
  });
  return normalizeMathText(refined);
}

function refineQuickExplanation(q) {
  let text = normalizeMathText(q.quickExplanation || "");
  if (q.number === 37) {
    text = text.replace("$2-8e^{-3}t+6e^{-4}t$", "$2-8e^{-3t}+6e^{-4t}$");
  }
  if (q.number === 38) {
    text = text.replace(/`uC`/g, "$u_c$");
  }
  if (q.number === 40) {
    text = text.replace(/`x_1`/g, "$x_1$").replace(/`x_2`/g, "$x_2$");
  }
  return text;
}

function refineKnowledgeDetail(q) {
  if (q.type !== "single_choice" && ESSAY_KNOWLEDGE_REVIEWED_OVERRIDES[q.number]) {
    return normalizeMathText(ESSAY_KNOWLEDGE_REVIEWED_OVERRIDES[q.number]);
  }
  if (q.type !== "single_choice" && ESSAY_KNOWLEDGE_OVERRIDES[q.number]) {
    return normalizeMathText(ESSAY_KNOWLEDGE_OVERRIDES[q.number]);
  }
  return polishedKnowledgeDetail(q);
}

function mapQuestion(q) {
  const isChoice = q.type === "single_choice";
  const type = isChoice ? "single" : "essay";
  const typeName = isChoice ? "单选题" : "大题";
  const images = [];
  if (q.number === 38) images.push("images/signal_system/image40.png");
  if (q.number === 40) images.push("images/signal_system/image49.png");

  return {
    id: q.number,
    label: `信号-${q.label}`,
    type,
    typeName,
    stem: normalizeMathText(q.stem || q.rawStem || ""),
    options: isChoice ? (q.options || []).map((opt) => ({
      key: opt.key,
      text: `${opt.key}. ${normalizeMathText(opt.text || opt.value || "")}`,
    })) : [],
    answer: isChoice ? q.answerKey : refineEssayAnswer(q, essayAnswer(q)),
    images,
    knowledge: q.knowledge || "",
    chapter: q.chapter || "",
    blankCount: 0,
    quickExplanation: refineQuickExplanation(q),
    knowledgeDetail: refineKnowledgeDetail(q),
    explanation: normalizeMathText(q.examWritingTemplate || q.memoryHint || ""),
  };
}

function validate(questions) {
  const errors = [];
  const badTokens = [
    "\\omegat",
    "\\pit",
    "\\pmj",
    "\\lambdaI",
    "e^(-",
    "uc'",
    "us",
  ];
  const badPatterns = [
    { label: "bare x1", pattern: /(^|[^A-Za-z0-9_])x1($|[^A-Za-z0-9_])/ },
    { label: "bare x2", pattern: /(^|[^A-Za-z0-9_])x2($|[^A-Za-z0-9_])/ },
  ];
  for (const q of questions) {
    if (!q.stem || !q.answer || !q.chapter || !q.knowledge) errors.push(`${q.label}: missing required field`);
    if (q.type === "single" && q.options.length !== 4) errors.push(`${q.label}: expected 4 options`);
    if (q.type === "single" && !q.knowledgeDetail.includes("| 选项 | 内容 | 结论 | 理由 |")) {
      errors.push(`${q.label}: missing option table`);
    }
    const text = JSON.stringify(q);
    for (const token of badTokens) {
      if (text.includes(token)) errors.push(`${q.label}: bad token ${token}`);
    }
    for (const check of badPatterns) {
      if (check.pattern.test(text)) errors.push(`${q.label}: bad token ${check.label}`);
    }
    for (const image of q.images) {
      if (!fs.existsSync(path.join(targetAssets, image))) errors.push(`${q.label}: missing image ${image}`);
    }
  }
  const typeCounts = questions.reduce((acc, q) => {
    acc[q.typeName] = (acc[q.typeName] || 0) + 1;
    return acc;
  }, {});
  if (questions.length !== 40) errors.push(`expected 40 questions, got ${questions.length}`);
  if (typeCounts["单选题"] !== 22) errors.push(`expected 22 single choices, got ${typeCounts["单选题"] || 0}`);
  if (typeCounts["大题"] !== 18) errors.push(`expected 18 essays, got ${typeCounts["大题"] || 0}`);
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  return typeCounts;
}

function applyReviewedOverrides(questions) {
  for (const q of questions) {
    const id = Number(q.id);
    if (q.type === "essay" && ESSAY_ANSWER_REVIEWED_OVERRIDES[id]) {
      q.answer = refineEssayAnswer({ number: id }, ESSAY_ANSWER_REVIEWED_OVERRIDES[id]);
    }
    if (q.type === "essay" && ESSAY_KNOWLEDGE_REVIEWED_OVERRIDES[id]) {
      q.knowledgeDetail = normalizeMathText(ESSAY_KNOWLEDGE_REVIEWED_OVERRIDES[id]);
    }
  }
}

function main() {
  ensureDir(targetImageDir);
  for (const name of ["image40.png", "image49.png"]) {
    fs.copyFileSync(path.join(sourceImageDir, name), path.join(targetImageDir, name));
  }

  const source = readJson(sourceData);
  const questions = source.map(mapQuestion);
  applyReviewedOverrides(questions);
  const typeCounts = validate(questions);
  fs.writeFileSync(targetQuestions, JSON.stringify(questions, null, 2) + "\n", "utf8");
  console.log(`Wrote ${targetQuestions}`);
  console.log(JSON.stringify(typeCounts, null, 2));
}

main();
