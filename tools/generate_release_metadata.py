import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "app" / "src" / "main" / "AndroidManifest.xml"
APK_PATH = ROOT / "build" / "out" / "计算机网络复习宝典.apk"
OUTPUT = ROOT / "release" / "network_quiz_update.json"


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apk-path", default=str(APK_PATH))
    parser.add_argument("--output", default=str(OUTPUT))
    parser.add_argument("--apk-download-url", default="")
    parser.add_argument("--release-html-url", default="")
    parser.add_argument("--repo-slug", default="ZhiKong0/review-baodian-apk")
    parser.add_argument("--release-notes", default="")
    parser.add_argument("--release-notes-file", default="")
    return parser.parse_args()


def read_manifest():
    text = MANIFEST.read_text(encoding="utf-8")
    package_name = re.search(r'package="([^"]+)"', text).group(1)
    version_code = int(re.search(r'android:versionCode="(\d+)"', text).group(1))
    version_name = re.search(r'android:versionName="([^"]+)"', text).group(1)
    return package_name, version_code, version_name


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def encode_url_path_segment(value: str) -> str:
    return quote(value, safe="")


def main():
    args = parse_args()
    package_name, version_code, version_name = read_manifest()
    apk_path = Path(args.apk_path)
    output = Path(args.output)
    release_notes = args.release_notes
    if args.release_notes_file:
        release_notes = Path(args.release_notes_file).read_text(encoding="utf-8").strip()

    output.parent.mkdir(parents=True, exist_ok=True)
    apk_download_url = args.apk_download_url.strip()
    release_html_url = args.release_html_url.strip() or f"https://github.com/{args.repo_slug}/releases/latest"
    download_candidates = []
    if apk_download_url:
        download_candidates.append(f"https://ghfast.top/{apk_download_url}")
        download_candidates.append(apk_download_url)
    encoded_apk_name = encode_url_path_segment(apk_path.name)
    latest_url = f"https://github.com/{args.repo_slug}/releases/latest/download/{encoded_apk_name}"
    tag_url = f"https://github.com/{args.repo_slug}/releases/download/v{version_name}/{encoded_apk_name}"
    for candidate in (
        f"https://ghfast.top/{latest_url}",
        latest_url,
        f"https://ghfast.top/{tag_url}",
        tag_url,
    ):
        if candidate not in download_candidates:
            download_candidates.append(candidate)
    data = {
        "packageName": package_name,
        "versionCode": version_code,
        "versionName": version_name,
        "apkFileName": apk_path.name,
        "apkDownloadUrl": download_candidates[0] if download_candidates else apk_download_url,
        "apkDownloadCandidates": download_candidates,
        "releaseHtmlUrl": release_html_url,
        "releaseNotes": release_notes,
        "apkSize": apk_path.stat().st_size if apk_path.exists() else 0,
        "sha256": sha256_file(apk_path) if apk_path.exists() else "",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()
