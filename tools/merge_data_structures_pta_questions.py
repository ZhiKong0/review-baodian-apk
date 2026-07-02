from __future__ import annotations

import json
from collections import Counter
from copy import deepcopy
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PTA_ROOT = Path(r"E:\Learning\课程学习\数据结构与算法\学习\Py数据结构\pta_data_structures_course")
OLD_QUESTIONS = PTA_ROOT / "raw" / "reference" / "data_structures_questions_before_lijun_20260701.json"
CURRENT_QUESTIONS = ROOT / "app" / "src" / "main" / "assets" / "data_structures_questions.json"
OUTPUT_QUESTIONS = CURRENT_QUESTIONS
REPORT_PATH = ROOT / "explanation_work" / "data_structures_pta_full_import_report.md"
IMAGE_ROOT = ROOT / "app" / "src" / "main" / "assets"


SOURCE_BY_PREFIX = {
    "L": "26-1 自测3 线性数据结构",
    "B": "26-1 二叉树练习2：二叉搜索树",
    "F": "26-1 自测5（填空题21题）",
    "O": "26-1 自测题6（客观题120题）",
    "DS6A": "26-1 练习题6（客观题，随机120题，不计成绩，供复习使用1）",
    "DS6B": "26-1 练习题6（客观题，随机120题，不计成绩，供复习使用2）",
    "DSP": "26-1 编程题2 练习题（19题，不计成绩，供复习使用）",
}


def load_json(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def label_prefix(label: str) -> str:
    if label.startswith("DS6A-"):
        return "DS6A"
    if label.startswith("DS6B-"):
        return "DS6B"
    if label.startswith("DSP-"):
        return "DSP"
    return label.split("-", 1)[0]


def is_code_answer_question(type_name: str) -> bool:
    name = (type_name or "").strip()
    if "程序填空" in name:
        return False
    return "编程" in name or "函数" in name or "程序题" in name


def normalize_question(raw: dict, new_id: int) -> dict:
    q = deepcopy(raw)
    q["id"] = new_id
    q["images"] = q.get("images") or []
    q["options"] = q.get("options") or []
    q["blankCount"] = int(q.get("blankCount") or 0)
    q["chapter"] = q.get("chapter") or "未分章"
    q["knowledge"] = q.get("knowledge") or q["chapter"]
    q["quickExplanation"] = q.get("quickExplanation") or ""
    q["knowledgeDetail"] = q.get("knowledgeDetail") or q.get("explanation") or q["quickExplanation"]
    q["explanation"] = q.get("explanation") or build_explanation(q)

    prefix = label_prefix(q.get("label", ""))
    if not q.get("source"):
        q["source"] = SOURCE_BY_PREFIX.get(prefix, prefix)

    if q.get("type") == "tf" and not q["options"]:
        q["options"] = [
            {"key": "TRUE", "text": "正确"},
            {"key": "FALSE", "text": "错误"},
        ]

    if q.get("type") in {"programming", "program", "function"} or (
        q.get("type") == "blank" and is_code_answer_question(q.get("typeName", ""))
    ):
        q["type"] = "essay"
        q["blankCount"] = 0
        q["options"] = []
        if isinstance(q.get("answer"), list) and len(q["answer"]) == 1:
            q["answer"] = q["answer"][0]
    return q


def build_explanation(q: dict) -> str:
    quick = (q.get("quickExplanation") or "").strip()
    detail = (q.get("knowledgeDetail") or "").strip()
    parts = []
    if quick:
        parts.append("【快速做题】\n" + quick)
    if detail:
        parts.append("【知识点详解】\n" + detail)
    return "\n\n".join(parts)


def validate(questions: list[dict]) -> list[str]:
    errors: list[str] = []
    ids = [q.get("id") for q in questions]
    labels = [q.get("label") for q in questions]
    if ids != list(range(1, len(questions) + 1)):
        errors.append("id must be consecutive from 1")
    if len(labels) != len(set(labels)):
        dupes = [label for label, count in Counter(labels).items() if count > 1]
        errors.append(f"duplicate labels: {dupes[:20]}")

    required = [
        "id",
        "label",
        "type",
        "typeName",
        "stem",
        "options",
        "answer",
        "images",
        "knowledge",
        "chapter",
        "blankCount",
        "quickExplanation",
        "knowledgeDetail",
        "explanation",
        "source",
    ]
    for q in questions:
        label = q.get("label", f"id={q.get('id')}")
        for key in required:
            if key not in q:
                errors.append(f"{label}: missing {key}")
        if not str(q.get("stem", "")).strip():
            errors.append(f"{label}: empty stem")
        if q.get("type") in {"single", "multi", "tf"}:
            keys = [opt.get("key") for opt in q.get("options", [])]
            if not keys:
                errors.append(f"{label}: choice question has no options")
            answer = str(q.get("answer", ""))
            if q.get("type") == "tf":
                if answer not in {"TRUE", "FALSE"}:
                    errors.append(f"{label}: bad tf answer {answer}")
                if set(keys) != {"TRUE", "FALSE"}:
                    errors.append(f"{label}: bad tf options {keys}")
            else:
                for letter in answer:
                    if letter not in keys:
                        errors.append(f"{label}: answer {letter} not in option keys {keys}")
                if q.get("type") == "multi" and "".join(sorted(answer)) != answer:
                    errors.append(f"{label}: multi answer is not sorted")
        if q.get("type") == "blank":
            answer = q.get("answer")
            answer_count = len(answer) if isinstance(answer, list) else 1
            if q.get("blankCount") != answer_count:
                errors.append(f"{label}: blankCount {q.get('blankCount')} != answers {answer_count}")
        if q.get("type") == "essay":
            if q.get("blankCount") != 0:
                errors.append(f"{label}: essay blankCount must be 0")
            if q.get("options"):
                errors.append(f"{label}: essay options must be empty")
        for image_path in q.get("images", []) + q.get("stemImages", []) + q.get("answerImages", []):
            if not (IMAGE_ROOT / image_path).exists():
                errors.append(f"{label}: missing image asset {image_path}")

    text = json.dumps(questions, ensure_ascii=False)
    if "�" in text or "????" in text:
        errors.append("mojibake marker found")
    return errors


def write_report(questions: list[dict], old_count: int, current_count: int) -> None:
    by_type = Counter(q["typeName"] for q in questions)
    by_chapter = Counter(q["chapter"] for q in questions)
    by_prefix = Counter(label_prefix(q["label"]) for q in questions)
    unique_stems = len({q["stem"].strip() for q in questions})

    lines = [
        "# 数据结构 PTA 全量题库合并报告",
        "",
        f"- 生成时间：{datetime.now().isoformat(timespec='seconds')}",
        f"- 旧 PTA 缓存题量：{old_count}",
        f"- 李俊老师 2026-07-01 三套题题量：{current_count}",
        f"- 合并后题量：{len(questions)}",
        f"- 合并后去重题干数：{unique_stems}",
        "",
        "## 按 PTA 题集前缀统计",
        "",
    ]
    for prefix, count in sorted(by_prefix.items()):
        lines.append(f"- {prefix}：{count} 题，{SOURCE_BY_PREFIX.get(prefix, prefix)}")

    lines += ["", "## 题型分布", ""]
    for name, count in by_type.most_common():
        lines.append(f"- {name}：{count}")

    lines += ["", "## 章节分布", ""]
    for name, count in by_chapter.most_common():
        lines.append(f"- {name}：{count}")

    lines += [
        "",
        "## 处理说明",
        "",
        "- PTA 随机复习套卷之间存在重复题干，本次按题集全量保留，不擅自删除重复套卷题。",
        "- 函数题、编程题按 `essay` 参考答案题处理。",
        "- 程序填空题继续按 `blank` 填空题处理。",
        "- 判断题统一保证包含 `正确 / 错误` 选项。",
    ]
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    old_questions = load_json(OLD_QUESTIONS)
    current_questions = load_json(CURRENT_QUESTIONS)
    merged_raw = old_questions + current_questions
    merged = [normalize_question(question, index) for index, question in enumerate(merged_raw, 1)]
    errors = validate(merged)
    if errors:
        for error in errors[:80]:
            print("ERROR", error)
        raise SystemExit(f"validation failed with {len(errors)} errors")

    OUTPUT_QUESTIONS.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_report(merged, len(old_questions), len(current_questions))
    print(f"wrote {OUTPUT_QUESTIONS}")
    print(f"wrote {REPORT_PATH}")
    print(f"total={len(merged)}")


if __name__ == "__main__":
    main()
