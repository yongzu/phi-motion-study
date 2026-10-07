#!/bin/bash
# Phi Motion Study: open Claude Code in this folder (double-click)
cd "$(dirname "$0")"
export PATH="$HOME/.local/bin:$PATH"
if ! command -v claude >/dev/null 2>&1; then echo "Claude Code is not installed. Run step 3 of the guide first."; read -r; exit 1; fi
echo "Starting Claude Code in $(pwd)"
echo "First time: log in, then type /model and choose Opus 5.5"
echo
claude
