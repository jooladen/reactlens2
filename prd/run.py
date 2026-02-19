import subprocess
import sys
import os
from datetime import datetime

# ================================
# 설정
# ================================
LOG_FILE = "prd/run-log.txt"
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CHUNKS = [
    {
        "number": 1,
        "name": "JSX 파일 생성",
        "prompt": "prd/HANDOFF.md와 prd/chunk_roadmap.md를 읽고 Chunk 1을 진행해줘"
    },
    {
        "number": 2,
        "name": "마무리",
        "prompt": "prd/HANDOFF.md와 prd/chunk_roadmap.md를 읽고 Chunk 2를 진행해줘"
    },
]

# ================================
# 유틸
# ================================
def log(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {message}"
    print(line, flush=True)
    log_path = os.path.join(PROJECT_ROOT, LOG_FILE)
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def separator(title=""):
    line = "=" * 50
    if title:
        print(f"\n{line}\n  {title}\n{line}", flush=True)
        log(f"--- {title} ---")
    else:
        print(line, flush=True)

# ================================
# Chunk 0 확인
# ================================
def check_chunk0():
    separator("Chunk 0 확인")

    with open(os.path.join(PROJECT_ROOT, "CLAUDE.md"), encoding="utf-8") as f:
        content = f.read()

    if "여기에_GitHub_저장소_URL_입력" in content:
        log("ERROR: CLAUDE.md에 GitHub URL이 아직 입력되지 않았습니다.")
        print("\n  → CLAUDE.md 열어서 GitHub 저장소 URL을 먼저 입력해주세요.")
        print("  → 그 다음 다시 python prd/run.py 실행\n")
        sys.exit(1)

    log("Chunk 0 확인 완료 - GitHub URL 입력됨")
    print("\n  → Chunk 1부터 자동 실행합니다. 자리 비워도 됩니다.\n", flush=True)

# ================================
# Chunk 실행
# ================================
def run_chunk(chunk):
    separator(f"Chunk {chunk['number']} 시작: {chunk['name']}")
    log(f"Chunk {chunk['number']} 시작: {chunk['name']}")

    # shell=True → 터미널처럼 인식해서 출력 버퍼링 없앰
    cmd = f'claude --dangerously-skip-permissions -p "{chunk["prompt"]}"'

    result = subprocess.run(
        cmd,
        shell=True,
        cwd=PROJECT_ROOT,
    )

    if result.returncode != 0:
        log(f"ERROR: Chunk {chunk['number']} 실패 (종료코드: {result.returncode})")
        print(f"\n  → Chunk {chunk['number']} 에서 문제가 생겼습니다.")
        print(f"  → prd/run-log.txt 확인해주세요.\n")
        sys.exit(1)

    log(f"Chunk {chunk['number']} 완료: {chunk['name']}")

# ================================
# 메인
# ================================
def main():
    os.makedirs(os.path.join(PROJECT_ROOT, "prd"), exist_ok=True)
    log_path = os.path.join(PROJECT_ROOT, LOG_FILE)
    with open(log_path, "a", encoding="utf-8") as f:
        f.write("\n" + "=" * 50 + "\n")
        f.write(f"실행 시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 50 + "\n")

    print("\n================================", flush=True)
    print("  Code Skeleton Viewer 자동 실행", flush=True)
    print("================================\n", flush=True)

    check_chunk0()

    for chunk in CHUNKS:
        run_chunk(chunk)

    separator("전체 완료!")
    log("전체 완료")
    print("\n  → prd/run-log.txt 에서 전체 기록 확인 가능\n")

if __name__ == "__main__":
    main()