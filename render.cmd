@echo off
rem Phi Motion Study: render MyIntro to out\my-intro.mp4 (double-click)
cd /d "%~dp0"
set "PATH=%ProgramFiles%\nodejs;%ProgramFiles%\Git\cmd;%USERPROFILE%\.local\bin;%PATH%"
title Phi Motion Study - Render
echo Rendering MyIntro... (about 1 minute)
call npx.cmd remotion render MyIntro out/my-intro.mp4
if exist out\my-intro.mp4 (echo Done: out\my-intro.mp4 & explorer.exe out) else (echo Render failed. Check the messages above.)
pause
