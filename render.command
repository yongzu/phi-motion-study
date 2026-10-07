#!/bin/bash
# Phi Motion Study: render MyIntro to out/my-intro.mp4 (double-click)
cd "$(dirname "$0")"
# Node.js 위치 (Claude 가 홈 폴더에 설치한 경우 포함)
export PATH="$HOME/.local/node/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
echo "Rendering MyIntro... (about 1 minute)"
npx remotion render MyIntro out/my-intro.mp4 && open out
echo "Press Enter to close."; read -r
