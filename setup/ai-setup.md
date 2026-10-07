# Phi Motion Study 설치 안내서 (AI 코딩 도우미용: Claude Code · Codex)

이 문서는 사용자가 AI 코딩 도우미(Claude Code 또는 Codex)에게 "이 안내서대로 설치해줘"라고 했을 때 도우미가 따르는 절차입니다. 아래에서 "도우미"는 이 문서를 읽는 당신입니다.
사용자는 대부분 Mac 을 쓰는 디자이너이고 터미널에 익숙하지 않습니다.

## 지켜야 할 것
- 단계마다 무엇을 하는지 **쉬운 한국어 한 문장**으로 먼저 말하고 실행합니다.
- `sudo` 는 쓰지 않습니다. 시스템 설정이나 보안 설정은 바꾸지 않습니다. 모든 설치는 사용자 홈 폴더 안에만 합니다.
- 이미 된 단계는 확인만 하고 건너뜁니다.
- 인터넷 접속이나 폴더 밖 쓰기가 샌드박스에 막히면, 이유를 한 문장으로 설명하고 사용자에게 실행 승인을 요청합니다.
- 명령이 실패하면 원인을 한 문장으로 설명하고 한 번 다시 시도합니다. 그래도 안 되면 멈추고, 사용자가 진행자에게 보여줄 수 있게 오류 메시지를 요약합니다.
- 모든 명령은 **현재 폴더**(`pwd`)를 기준으로 합니다.

## 1. 폴더 확인
`pwd` 와 `ls -A` 로 현재 폴더를 확인합니다.
- 폴더 이름이 `phi-motion-study` 이거나 비어 있으면 여기에 설치합니다.
- 그 밖의 경우: 홈 폴더(`~`)라면 `mkdir -p ~/phi-motion-study && cd ~/phi-motion-study` 로 옮겨서 진행하고, 그 외에는 사용자에게 물어봅니다.

## 2. Node.js (20 이상)
`node -v` 로 확인합니다. 20 이상이면 건너뜁니다.

없거나 오래된 경우, **공식 Node.js 22 LTS 바이너리를 홈 폴더에 설치**합니다 (관리자 비밀번호 필요 없음).

Mac:
```bash
ARCH=$(uname -m); [ "$ARCH" = "x86_64" ] && ARCH=x64
FILE=$(curl -fsSL https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt | grep "darwin-$ARCH.tar.gz" | awk '{print $2}')
mkdir -p ~/.local/node
curl -fsSL "https://nodejs.org/dist/latest-v22.x/$FILE" | tar -xz -C ~/.local/node --strip-components=1
grep -qs '.local/node/bin' ~/.zshrc || echo 'export PATH="$HOME/.local/node/bin:$PATH"' >> ~/.zshrc
export PATH="$HOME/.local/node/bin:$PATH"
node -v
```
이후 이 세션의 모든 명령 앞에 `export PATH="$HOME/.local/node/bin:$HOME/.local/bin:$PATH";` 를 붙여 실행합니다 (도우미의 셸은 `~/.zshrc` 를 다시 읽지 않습니다).

Windows 라면 이 안내서 대신 가이드의 Windows 설치 명령(`setup/setup.ps1`)을 쓰라고 안내하고 멈춥니다.

## 3. 소스 내려받기
현재 폴더에 `package.json` 이 있으면 건너뜁니다.

Git 이 이미 준비돼 있는지 **팝업을 띄우지 않고** 확인합니다: `xcode-select -p` 가 성공하면 Git 사용 가능.
- Git 사용 가능 + 빈 폴더: `git clone https://github.com/yongzu/phi-motion-study.git .`
- Git 사용 가능 + 파일이 이미 있음: `git init && git remote add origin https://github.com/yongzu/phi-motion-study.git && git fetch origin main && git checkout -t origin/main`
- Git 없음: ZIP 으로 받습니다 (개발자 도구 설치 창을 띄우지 않기 위해).
  ```bash
  curl -fsSL -o /tmp/phi-motion-study.zip https://github.com/yongzu/phi-motion-study/archive/refs/heads/main.zip
  rm -rf /tmp/phi-motion-study-main && unzip -q /tmp/phi-motion-study.zip -d /tmp
  ditto /tmp/phi-motion-study-main/ ./
  ```
  이 경우 폴더가 Git 저장소가 아니므로, 스터디 중 "명령을 커밋으로 남기기"는 건너뛴다고 사용자에게 알려줍니다.

그다음:
```bash
mkdir -p references
chmod +x *.command 2>/dev/null || true
```

## 4. 패키지 설치
```bash
npm ci --no-audit --no-fund
```
1분 정도 걸린다고 먼저 알려줍니다. 경고(warn)는 무시해도 됩니다.

## 5. 렌더 테스트
```bash
npx remotion still MyIntro out/check.png --frame=100
```
처음에는 렌더용 Chrome 을 내려받느라 1~2분 걸립니다. 끝나면 `out/check.png` 를 직접 열어 보고 (이미지를 볼 수 있다면) Phi 로고가 보이는지 확인합니다. 이미지를 볼 수 없으면 파일이 생겼는지만 확인합니다.

## 6. 마무리
- `open .` 으로 Finder 에서 폴더를 엽니다.
- 사용자에게 아래를 그대로 안내합니다.
  1. 진행자에게 받은 레퍼런스 영상 ZIP 을 풀어 `references` 폴더에 넣으세요.
  2. `Ctrl + C` 를 눌러 지금 도우미를 끝낸 뒤(두 번 눌러야 할 수도 있음), 같은 창에 다시 `claude` (Codex 라면 `codex`) 를 입력하세요. 방금 받은 프로젝트 안내서(`CLAUDE.md` / `AGENTS.md`)를 새로 읽게 하기 위해서입니다.
  3. 그다음 가이드 페이지의 "첫 메시지"를 붙여넣으면 시작입니다.
