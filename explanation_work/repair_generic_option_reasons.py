import json
from pathlib import Path


QUESTION_PATH = Path("app/src/main/assets/questions.json")


REPLACEMENTS = {
    "1-9": {
        "F：不选。这会把本来正确的说法否掉。":
        "F：不选。题干的三个关键词“面向连接、可靠、面向字节流”正是 TCP 的核心特征；选 F 会把 TCP 和 UDP 的差异判反。"
    },
    "1-27": {
        "F：不选。这会把本来正确的说法否掉。":
        "F：不选。题干说的是网页用 HTML/HTML5 描述与显示，这一说法成立；不要把 HTML 和 HTTP 的作用混淆后误判为错。"
    },
    "1-35": {
        "F：不选。这会把本来正确的说法否掉。":
        "F：不选。TCP 和 UDP 都有端口号，所以都能复用/分用；两者也都有校验和，不能因为 UDP 不可靠就否定检错功能。"
    },
    "1-47": {
        "F：不选。这会把本来正确的说法否掉。":
        "F：不选。DHCP 的作用就是自动获取 IP、网关、DNS 等网络参数；选 F 等于把“自动配置”这个核心功能否掉。"
    },
    "1-67": {
        "F：不选。这会把本来正确的说法否掉。":
        "F：不选。运输层讨论的是源端到目的端的进程通信；链路层等下层多是逐跳/相邻节点传递，本题层次划分正确。"
    },
    "1-91": {
        "F：不选。这会把本来正确的说法否掉。":
        "F：不选。TCP/UDP 首部中的端口号字段就是 16 bit，范围 0~65535；不要把端口号和 32 bit IPv4 地址混为一谈。"
    },
    "1-106": {
        "F：不选。这会把本来正确的说法否掉。":
        "F：不选。拥塞来自全网负载、路由器队列和链路资源紧张，是网络整体问题；这和只照顾接收端的流量控制不同。"
    },
    "2-22": {
        "D：不选。A 本身就是正确说法。":
        "D：不选。A 已经准确表达“两个方向同时传输”；D 只有在 A/B/C 都不符合时才选，这里没有排除 A 的理由。"
    },
    "2-83": {
        "D：不选。因为 A 已经是正确答案。":
        "D：不选。A 的 C/S 正是 DNS 查询模式：客户发起查询，DNS 服务器返回或代查结果，所以不能选“以上都不正确”。"
    },
    "1-21": {
        "T：不选。它混淆了发送速率和传播速率。":
        "T：不选。题干说介质或调制技术能提高“传播速率”，但这些通常提高的是发送速率、信道容量或数据率；传播速率主要由介质物理性质决定。"
    },
    "1-23": {
        "T：不选。以太网不是面向连接。":
        "T：不选。题干后半句体现以太网无连接、不可靠服务，开头却写成“面向连接”；只要把以太网 MAC 服务说成面向连接就错。"
    },
    "1-24": {
        "F：应选。MAC 地址属于链路层地址。":
        "F：应选。硬件地址/MAC 地址虽然也叫“物理地址”，但它用于数据链路层帧寻址，不是物理层传输比特的信号地址。"
    },
    "1-50": {
        "F：应选。题干颠倒了两个速率。":
        "F：应选。高速链路提高的是单位时间推出比特的发送速率；题干说成提高传播速率，把“发得快”和“跑得快”颠倒了。"
    },
    "1-60": {
        "T：不选。物理结构不是主要区别。":
        "T：不选。二者底层物理形态都可能是多机互连；关键差别是分布式系统靠高层软件把多台机器包装成统一透明服务。"
    },
    "1-62": {
        "T：不选。无碎片直通比存储转发快。":
        "T：不选。无碎片直通只等前 64 字节就转发，比完整接收并校验的存储转发快；说它是最慢方式不对。"
    },
    "1-77": {
        "T：不选。网络层只在第三层。":
        "T：不选。OSI 七层从低到高第三层才是网络层，最高层是应用层；题干把网络层的位置抬高了。"
    },
    "1-80": {
        "T：不选。无线媒体并不只传数字信号。":
        "T：不选。无线电波可以承载模拟调制信号，广播、电视等传统无线通信就常传模拟信号；题干说“不可以”太绝对。"
    },
    "1-86": {
        "T：不选。“所有”太绝对。":
        "T：不选。是否同时支持 10BASE-T 和 100BASE-T 取决于交换机端口规格；题干用“所有端口都支持”把个别设备能力泛化了。"
    },
    "1-109": {
        "T：不选。6G 尚未成为普遍商用时代。":
        "T：不选。按本题考试语境，6G 仍属于研发、试验和标准推进方向，不能说已经普遍进入 6G 时代。"
    },
}


def main() -> None:
    questions = json.loads(QUESTION_PATH.read_text(encoding="utf-8"))
    changed = []
    missing = []
    for question in questions:
        label = question.get("label")
        replacements = REPLACEMENTS.get(label)
        if not replacements:
            continue
        for field in ("quickExplanation", "explanation"):
            original = question.get(field) or ""
            updated = original
            for old, new in replacements.items():
                updated = updated.replace(old, new)
            if updated != original:
                question[field] = updated
                changed.append((label, field))
        if not any(label == item[0] for item in changed):
            missing.append(label)
    QUESTION_PATH.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"changed={changed}")
    print(f"missing={missing}")


if __name__ == "__main__":
    main()
