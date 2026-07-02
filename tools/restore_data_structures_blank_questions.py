from __future__ import annotations

import json
import re
import subprocess
from collections import Counter
from copy import deepcopy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
QUESTIONS_PATH = ROOT / "app" / "src" / "main" / "assets" / "data_structures_questions.json"
CARDS_PATH = ROOT / "app" / "src" / "main" / "assets" / "data_structures_chapter_cards.json"
SOURCE_COMMIT = "ee55ddd"
ASSET_PATH = "app/src/main/assets/data_structures_questions.json"


def load_history_questions() -> list[dict]:
    raw = subprocess.check_output(["git", "show", f"{SOURCE_COMMIT}:{ASSET_PATH}"])
    return json.loads(raw.decode("utf-8"))


def normalize_blank_question(raw: dict) -> dict:
    q = deepcopy(raw)
    q["type"] = "blank"
    q["options"] = []
    q["images"] = q.get("images") or []
    q["stem"] = clean_pta_stem(q.get("stem", ""))
    q["blankCount"] = int(q.get("blankCount") or len(q.get("answer") or []))
    q["source"] = q.get("source") or "26-1 自测5（填空题21题）"
    if isinstance(q.get("answer"), str):
        q["answer"] = [q["answer"]]
    return q


def clean_pta_stem(value: str) -> str:
    text = (value or "").replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\u00a0", " ")
    cleaned: list[str] = []
    for raw in text.split("\n"):
        line = raw.strip()
        if not line:
            cleaned.append("")
            continue
        if line in {"复制内容", "格式", "全屏", "收起"}:
            continue
        if re.fullmatch(r"\[\s*(Python|in|out)\s*\]", line, flags=re.IGNORECASE):
            continue
        if re.fullmatch(r"\d+", line):
            continue
        cleaned.append(raw.rstrip())
    text = "\n".join(cleaned)
    text = re.sub(r"(复制内容|格式|全屏|收起)", "", text)
    text = re.sub(r"\[\s*(Python|in|out)\s*\]", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def type_distribution(questions: list[dict]) -> str:
    counts = Counter(q["typeName"] for q in questions)
    order = ["判断题", "单选题", "填空题", "程序填空题", "函数题", "编程题"]
    parts = []
    for name in order:
        if counts.get(name):
            parts.append(f"{name} {counts[name]}")
    for name, count in counts.items():
        if name not in order:
            parts.append(f"{name} {count}")
    return "；".join(parts)


def update_cards(questions: list[dict]) -> None:
    cards = json.loads(CARDS_PATH.read_text(encoding="utf-8"))
    by_chapter: dict[str, list[dict]] = {}
    for q in questions:
        by_chapter.setdefault(q["chapter"], []).append(q)

    existing = {card["chapter"]: card for card in cards}
    ordered_chapters = [
        "1. 线性数据结构",
        "2. 树与二叉搜索树",
        "3. 算法复杂度与查找排序",
        "4. Python 基础与面向对象",
        "5. 程序填空与代码理解",
        "5. Python 程序设计题",
    ]
    for chapter in by_chapter:
        if chapter not in ordered_chapters:
            ordered_chapters.append(chapter)

    new_cards = []
    for chapter in ordered_chapters:
        qs = by_chapter.get(chapter, [])
        if not qs:
            continue
        card = deepcopy(existing.get(chapter) or {})
        card.setdefault("chapter", chapter)
        card.setdefault("knowledge", chapter.split(". ", 1)[-1])
        card["questionCount"] = len(qs)
        card["typeDistribution"] = type_distribution(qs)
        card["labels"] = [q["label"] for q in qs]
        card.setdefault("layerHint", f"{chapter}：先掌握定义，再回到题目逐项验证。")
        card.setdefault("chapterMap", [])
        card.setdefault("eyeLines", [])
        card.setdefault("selfChecks", [])
        card.setdefault("corePoints", [])
        card.setdefault("mustRemember", [])
        card.setdefault("traps", [])
        card.setdefault("questionTips", [])
        if chapter == "5. 程序填空与代码理解":
            card["knowledge"] = "程序填空与代码理解"
            card["layerHint"] = "程序填空要顺着变量含义、控制流和输出格式补空。"
            card["corePoints"] = [
                "链表结点保存 data 和 next，遍历靠 current 沿 next 前进。",
                "队列用列表实现时，要先确认题目把队尾放在哪一端。",
                "range(start, stop, step) 右端不取，step 决定递增或递减。",
                "程序填空答案必须和上下文变量名、缩进、输出格式一致。",
            ]
            card["mustRemember"] = [
                "表头插入链表：先 new.next = old_head，再 head = new。",
                "阶乘循环：fact 累乘 i，i 每轮加 1。",
                "三位数个位：i % 10；十位：i // 10 % 10。",
            ]
            card["traps"] = [
                "不要把 range 的 stop 当作会取到的值。",
                "不要把链表遍历写成下标访问。",
                "不要把程序填空题转成函数题或编程题，它需要逐空输入答案。",
            ]
            card["questionTips"] = [
                "F-R2-1/F-R2-2/F-R2-5：链表结点、遍历和表头插入。",
                "F-R2-3：列表实现队列，队尾在下标 0，出队从尾部 pop。",
                "F-R2-4/F-R2-6/F-R2-7：range、while 累乘、数位拆分。",
            ]
        new_cards.append(card)

    CARDS_PATH.write_text(json.dumps(new_cards, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    current = json.loads(QUESTIONS_PATH.read_text(encoding="utf-8"))
    history = load_history_questions()
    blanks = [
        normalize_blank_question(q)
        for q in history
        if q.get("type") == "blank" or "填空" in q.get("typeName", "")
    ]
    blank_labels = {q["label"] for q in blanks}
    merged = [q for q in current if q["label"] not in blank_labels]
    merged.extend(blanks)
    for index, q in enumerate(merged, 1):
        q["id"] = index

    labels = [q["label"] for q in merged]
    if len(labels) != len(set(labels)):
        raise SystemExit("duplicate labels after merge")
    if len(blanks) != 23:
        raise SystemExit(f"expected 23 blank questions, got {len(blanks)}")

    QUESTIONS_PATH.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    update_cards(merged)
    print(f"questions={len(merged)}")
    print(f"blank_questions={len(blanks)}")
    print(Counter(q["typeName"] for q in merged))


if __name__ == "__main__":
    main()
