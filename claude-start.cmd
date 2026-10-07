@echo off
rem Phi Motion Study: open Claude Code in this folder (double-click)
cd /d "%~dp0"
set "PATH=%ProgramFiles%\nodejs;%ProgramFiles%\Git\cmd;%USERPROFILE%\.local\bin;%PATH%"
title Phi Motion Study - Claude Code
where claude >nul 2>nul || (echo Claude Code is not installed. Run step 3 of the guide first. & pause & exit /b 1)
echo Starting Claude Code in %CD%
echo First time: log in, then type /model and choose Opus 5.5
echo.
claude
pause
