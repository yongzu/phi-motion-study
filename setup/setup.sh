#!/usr/bin/env bash
# Phi Motion Study 설치 스크립트 (macOS)
#
# 사용법 (터미널에 붙여넣기):
#   curl -fsSL https://raw.githubusercontent.com/yongzu/phi-motion-study/main/setup/setup.sh | bash
#
# 하는 일
#   1. Git 이 없으면 Xcode Command Line Tools 설치 안내
#   2. Node.js 가 없으면 Homebrew 로 설치 (Homebrew 가 없으면 nodejs.org 안내)
#   3. Claude Code 가 없으면 공식 설치 스크립트로 설치
#   4. 홈 폴더에 phi-motion-study 를 내려받고 npm 패키지 설치
#   5. 렌더 테스트 (out/check.png)
#
# 설치 위치를 바꾸려면:  PHI_DIR=~/work/phi-motion-study bash setup.sh
set -euo pipefail

REPO="https://github.com/yongzu/phi-motion-study.git"
HERE="$(pwd)"
if [ -n "${PHI_DIR:-}" ]; then DIR="$PHI_DIR"
elif [ "$(basename "$HERE")" = "phi-motion-study" ] || [ -z "$(ls -A "$HERE")" ]; then DIR="$HERE"
else DIR="$HOME/phi-motion-study"; fi
step() { printf '\n\033[36m[%s/5] %s\033[0m\n' "$1" "$2"; }
ok() { printf '  \033[32mOK\033[0m  %s\n' "$1"; }
has() { command -v "$1" >/dev/null 2>&1; }
export PATH="$HOME/.local/bin:$PATH"

echo "Phi Motion Study 설치를 시작합니다."
echo "설치 위치: $DIR"

step 1 "Git"
if git --version >/dev/null 2>&1; then ok "$(git --version)"; else
  echo "  Git 이 없습니다. 뜨는 창에서 '설치'를 누른 뒤, 끝나면 이 명령을 다시 실행하세요."
  xcode-select --install || true
  exit 1
fi

step 2 "Node.js"
need_node=1
if has node; then
  major=$(node -v | sed 's/^v//' | cut -d. -f1)
  if [ "$major" -ge 20 ]; then need_node=0; ok "Node.js $(node -v)"; fi
fi
if [ "$need_node" = 1 ]; then
  if has brew; then echo "  Node.js 설치 중..."; brew install node; ok "Node.js $(node -v)"
  else
    echo "  Node.js 20 이상이 필요합니다. 가이드 4단계대로 nodejs.org 에서 .pkg 를 설치하고, 터미널을 다시 열어 이 명령을 다시 붙여넣으세요."
    exit 1
  fi
fi

step 3 "Claude Code"
if has claude; then ok "Claude Code $(claude --version)"; else
  echo "  Claude Code 설치 중..."
  curl -fsSL https://claude.ai/install.sh | bash
  has claude && ok "Claude Code $(claude --version)" || echo "  설치는 끝났지만 새 터미널에서 claude 명령이 잡힙니다."
fi
# 터미널을 다시 열었을 때 claude 가 잡히도록 (Mac 기본 셸 zsh)
if ! grep -qs '.local/bin' "$HOME/.zshrc"; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
fi

step 4 "프로젝트 내려받기"
if [ -f "$DIR/package.json" ]; then ok "이미 있음: $DIR"
elif [ -d "$DIR" ] && [ -n "$(ls -A "$DIR")" ]; then
  # 폴더에 이미 파일(예: references)이 있으면 그 자리에 받는다
  git -C "$DIR" init --quiet
  git -C "$DIR" remote add origin "$REPO"
  git -C "$DIR" fetch --quiet origin main
  git -C "$DIR" checkout --quiet -t origin/main
  ok "내려받음: $DIR"
else git clone --quiet "$REPO" "$DIR"; ok "내려받음: $DIR"; fi
mkdir -p "$DIR/references"
cd "$DIR"
echo "  npm 패키지 설치 중... (1분 정도)"
npm ci --no-audit --no-fund --loglevel=error
ok "npm 패키지 설치"

step 5 "렌더 테스트 (처음에는 렌더용 Chrome 을 내려받아 1~2분 걸립니다)"
npx remotion still MyIntro out/check.png --frame=100 --log=error
[ -f out/check.png ] && ok "렌더 성공: $DIR/out/check.png"

echo
printf '\033[32m준비 완료!\033[0m\n'
echo "  폴더: $DIR"
echo "  다음: 가이드 페이지의 6단계 (레퍼런스 넣기) → 7단계 (터미널을 ⌘Q 로 끄고 다시 열어 claude 시작)"
chmod +x "$DIR"/*.command 2>/dev/null || true
open "$DIR" 2>/dev/null || true
