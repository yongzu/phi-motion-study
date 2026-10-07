@echo off
rem Phi Motion Study: open the preview (Remotion Studio) in the browser (double-click)
cd /d "%~dp0"
set "PATH=%ProgramFiles%\nodejs;%ProgramFiles%\Git\cmd;%USERPROFILE%\.local\bin;%PATH%"
title Phi Motion Study - Preview
echo Opening preview in your browser... Keep this window open while you work.
call npm.cmd run studio
pause
