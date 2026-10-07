#!/bin/bash
# Phi Motion Study: render MyIntro to out/my-intro.mp4 (double-click)
cd "$(dirname "$0")"
echo "Rendering MyIntro... (about 1 minute)"
npx remotion render MyIntro out/my-intro.mp4 && open out
echo "Press Enter to close."; read -r
