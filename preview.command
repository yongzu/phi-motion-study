#!/bin/bash
# Phi Motion Study: open the preview (Remotion Studio) in the browser (double-click)
cd "$(dirname "$0")"
# Node.js 위치 (Claude 가 홈 폴더에 설치한 경우 포함)
export PATH="$HOME/.local/node/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
echo "Opening preview in your browser... Keep this window open while you work."
npm run studio
