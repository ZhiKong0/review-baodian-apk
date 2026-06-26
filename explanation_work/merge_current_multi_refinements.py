import json
from pathlib import Path


QUESTION_PATH = Path("app/src/main/assets/questions.json")
OUTPUTS = [
    Path("explanation_work/agent_outputs/current_multi_refine_1.json"),
    Path("explanation_work/agent_outputs/current_multi_refine_2.json"),
    Path("explanation_work/agent_outputs/current_multi_refine_3.json"),
]
REQUIRED_SECTIONS = ["核心知识点：", "题目变形：", "知识拓展："]


def load_items(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array")
    return data


def validate_item(item: dict, path: Path) -> None:
    label = item.get("label")
    quick = item.get("quickExplanation", "")
    detail = item.get("knowledgeDetail", "")
    if not label or not isinstance(label, str):
        raise ValueError(f"{path}: item missing label")
    if "|---" not in quick:
        raise ValueError(f"{path}: {label} quickExplanation has no markdown table")
    for section in REQUIRED_SECTIONS:
        if section not in detail:
            raise ValueError(f"{path}: {label} missing {section}")
    if "第一步" in quick or "第二步" in quick or "第一步" in detail or "第二步" in detail:
        raise ValueError(f"{path}: {label} contains step wording")


def main() -> None:
    questions = json.loads(QUESTION_PATH.read_text(encoding="utf-8"))
    by_label = {q.get("label"): q for q in questions}
    changed: list[str] = []
    seen: set[str] = set()
    missing_outputs = [str(path) for path in OUTPUTS if not path.exists()]
    if missing_outputs:
        raise FileNotFoundError("Missing refinement outputs: " + ", ".join(missing_outputs))

    for path in OUTPUTS:
        for item in load_items(path):
            validate_item(item, path)
            label = item["label"]
            if label in seen:
                raise ValueError(f"duplicate label in refinement outputs: {label}")
            seen.add(label)
            question = by_label.get(label)
            if question is None:
                raise KeyError(f"{path}: unknown label {label}")
            question["quickExplanation"] = item["quickExplanation"]
            question["knowledgeDetail"] = item["knowledgeDetail"]
            changed.append(label)

    QUESTION_PATH.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"merged={len(changed)}")
    print("labels=" + ", ".join(changed))


if __name__ == "__main__":
    main()
