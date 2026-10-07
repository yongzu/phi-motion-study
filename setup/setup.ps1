# Phi Motion Study 설치 스크립트 (Windows PowerShell)
#
# 사용법 (PowerShell 에 붙여넣기):
#   irm https://raw.githubusercontent.com/yongzu/phi-motion-study/main/setup/setup.ps1 | iex
#
# 하는 일
#   1. Git, Node.js LTS 가 없으면 winget 으로 설치
#   2. Claude Code 가 없으면 공식 설치 스크립트로 설치 (Codex 를 쓰려면 먼저 $env:PHI_TOOL = "codex")
#   3. 소스를 내려받고 npm 패키지 설치
#      - 지금 열린 폴더가 phi-motion-study 이거나 비어 있으면 → 그 폴더에
#      - 아니면 → 홈 폴더의 phi-motion-study 에
#   4. 렌더 테스트 (out/check.png)
#
# 설치 위치를 바꾸려면 먼저:  $env:PHI_DIR = "D:\phi-motion-study"

$ErrorActionPreference = 'Stop'
$Repo = 'https://github.com/yongzu/phi-motion-study.git'
$Here = (Get-Location).ProviderPath
$HereEmpty = -not (Get-ChildItem -Force -LiteralPath $Here -ErrorAction SilentlyContinue | Select-Object -First 1)
$Dir = if ($env:PHI_DIR) { $env:PHI_DIR }
       elseif ((Split-Path $Here -Leaf) -eq 'phi-motion-study' -or $HereEmpty) { $Here }
       else { Join-Path $HOME 'phi-motion-study' }

function Step($n, $msg) { Write-Host ""; Write-Host "[$n/5] $msg" -ForegroundColor Cyan }
function Ok($msg) { Write-Host "  OK  $msg" -ForegroundColor Green }
function Has($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function RefreshPath {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
              [Environment]::GetEnvironmentVariable('Path', 'User') + ';' +
              (Join-Path $HOME '.local\bin')
}
function WingetInstall($id, $name) {
  if (-not (Has 'winget')) {
    throw "winget 이 없습니다. Microsoft Store 에서 '앱 설치 관리자'를 설치하거나, $name 을(를) 직접 설치한 뒤 다시 실행하세요."
  }
  Write-Host "  $name 설치 중... (설치 창이 뜨면 허용해 주세요)"
  winget install --id $id -e --source winget --accept-package-agreements --accept-source-agreements --silent | Out-Host
  RefreshPath
}

Write-Host "Phi Motion Study 설치를 시작합니다." -ForegroundColor White
Write-Host "설치 위치: $Dir"

# 1. Git
Step 1 'Git'
if (Has 'git') { Ok (git --version) } else { WingetInstall 'Git.Git' 'Git'; Ok (git --version) }

# 2. Node.js (20 이상)
Step 2 'Node.js'
$needNode = $true
if (Has 'node') {
  $major = [int]((node -v).TrimStart('v').Split('.')[0])
  if ($major -ge 20) { $needNode = $false; Ok "Node.js $(node -v)" }
  else { Write-Host "  Node.js $(node -v) 는 오래된 버전이라 LTS 로 설치합니다." }
}
if ($needNode) { WingetInstall 'OpenJS.NodeJS.LTS' 'Node.js LTS'; Ok "Node.js $(node -v)" }

# 3. Claude Code
# 공식 설치본(claude.exe)을 쓴다. npm 으로 설치된 예전 버전은 claude.ps1 스크립트라서
# Windows 기본 실행 정책(Restricted)에 막힌다. 실행 정책은 바꾸지 않고, claude.exe 가 먼저 잡히게 한다.
$Tool = if ($env:PHI_TOOL -eq 'codex') { 'codex' } else { 'claude' }
if ($Tool -eq 'codex') {
  Step 3 'Codex (GPT)'
  # 실행 정책에 막히는 .ps1 대신 실행 파일(Application)만 찾는다
  $codex = Get-Command codex -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $codex) {
    Write-Host '  Codex 설치 중...'
    Invoke-RestMethod https://chatgpt.com/codex/install.ps1 | Invoke-Expression
    RefreshPath
    $codex = Get-Command codex -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  }
  if ($codex) { Ok "Codex $(& $codex.Source --version)" }
  else { Write-Host '  설치는 끝났지만 새 창에서 codex 명령이 잡힙니다.' -ForegroundColor Yellow }
} else {
  Step 3 'Claude Code'
  $ClaudeBin = Join-Path $HOME '.local\bin'
  $ClaudeExe = Join-Path $ClaudeBin 'claude.exe'
  if (-not (Test-Path $ClaudeExe)) {
    Write-Host '  Claude Code 설치 중...'
    Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression
  }
  if (-not (Test-Path $ClaudeExe)) { throw 'Claude Code 설치에 실패했습니다. https://code.claude.com/docs/en/setup 을 참고해 직접 설치한 뒤 다시 실행하세요.' }
  # 사용자 PATH 맨 앞에 claude.exe 폴더를 둔다 → 새 창에서도, 이 창에서도 claude 를 바로 입력할 수 있다
  $userPath = @([Environment]::GetEnvironmentVariable('Path', 'User') -split ';' | Where-Object { $_ -and ($_.TrimEnd('\') -ne $ClaudeBin) })
  [Environment]::SetEnvironmentVariable('Path', (@($ClaudeBin) + $userPath) -join ';', 'User')
  $env:Path = $ClaudeBin + ';' + (($env:Path -split ';' | Where-Object { $_ -and ($_.TrimEnd('\') -ne $ClaudeBin) }) -join ';')
  Ok "Claude Code $(& $ClaudeExe --version)"
}

# 4. 프로젝트 내려받기 + 패키지 설치
Step 4 '프로젝트 내려받기'
if ($Dir.Length -gt 120) { Write-Host "  경고: 경로가 길면 렌더가 실패할 수 있습니다. 짧은 경로를 권장합니다." -ForegroundColor Yellow }
if (Test-Path (Join-Path $Dir 'package.json')) { Ok "이미 있음: $Dir" }
elseif ((Test-Path $Dir) -and (Get-ChildItem -Force -LiteralPath $Dir | Select-Object -First 1)) {
  # 폴더에 이미 파일(예: references)이 있으면 그 자리에 받는다
  git -C $Dir init --quiet
  git -C $Dir remote add origin $Repo
  git -C $Dir fetch --quiet origin main
  git -C $Dir checkout --quiet -t origin/main
  Ok "내려받음: $Dir"
}
else { git clone --quiet $Repo $Dir; Ok "내려받음: $Dir" }
New-Item -ItemType Directory -Force (Join-Path $Dir 'references') | Out-Null
Push-Location $Dir
try {
  Write-Host '  npm 패키지 설치 중... (1분 정도)'
  # PowerShell 실행 정책에 막히지 않도록 .cmd 를 직접 부른다
  npm.cmd ci --no-audit --no-fund --loglevel=error | Out-Host
  Ok 'npm 패키지 설치'

  # 5. 렌더 테스트
  Step 5 '렌더 테스트 (처음에는 렌더용 Chrome 을 내려받아 1~2분 걸립니다)'
  npx.cmd remotion still MyIntro out/check.png --frame=100 --log=error | Out-Host
  if (Test-Path 'out/check.png') { Ok "렌더 성공: $Dir\out\check.png" } else { throw '렌더 테스트 실패' }
}
finally { Pop-Location }

Write-Host ""
Write-Host "준비 완료!" -ForegroundColor Green
Write-Host "  폴더: $Dir"
Write-Host "  다음: 가이드 페이지의 4단계 (레퍼런스 넣기) → 5단계에서 이 창에 $Tool 을 입력하세요."
explorer.exe $Dir
Set-Location $Dir
