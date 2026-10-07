# Phi Motion Study

Phi 로고 인트로 모션 스터디 자료입니다. **모두 같은 소스로 시작하고, 각자 고른 레퍼런스와 자기 의도를 담아** 짧은 로고 인트로를 만듭니다.

> 예시 결과물: [`examples/ref11-intro.mp4`](examples/ref11-intro.mp4) (8초)
> 점 하나가 선이 되고, 선이 타원이 되고, 타원이 돌며 둘로 나뉘어 2D 마크가 됩니다. 마크가 3D로 깨어나 회전하면 오른쪽에 워드마크가 올라옵니다.

## 사전 준비 (스터디 전에 꼭)

**한 줄 설치 (권장):** Git, Node.js, Claude Code 설치부터 프로젝트 내려받기와 렌더 테스트까지 한 번에 합니다. 이미 설치된 것은 건너뜁니다.

Windows (PowerShell):
```powershell
irm https://raw.githubusercontent.com/yongzu/phi-motion-study/main/setup/setup.ps1 | iex
```

macOS (터미널):
```bash
curl -fsSL https://raw.githubusercontent.com/yongzu/phi-motion-study/main/setup/setup.sh | bash
```

직접 설치하려면 아래 표를 따르세요.

| 설치 | 확인 명령 | 비고 |
|---|---|---|
| [Git](https://git-scm.com/downloads) | `git --version` | Windows는 Git for Windows (Claude Code가 Git Bash를 씀) |
| [Node.js LTS](https://nodejs.org/) (22 이상 권장) | `node -v` | npm 포함 |
| [Claude Code](https://code.claude.com/docs/en/setup) | `claude --version` | Windows PowerShell: `irm https://claude.ai/install.ps1 \| iex` · macOS: `curl -fsSL https://claude.ai/install.sh \| bash` · 또는 [데스크톱 앱](https://claude.com/download) |
| Claude 계정 | `claude` 실행 후 로그인 | Pro / Max / Team 등 유료 요금제 필요. 세션에서 `/model`로 **Opus 5.5** 선택 |
| (선택) VS Code | | 코드 보기용 |

설치가 끝나면 아래 "시작하기"를 **스터디 전에 한 번** 끝까지 실행해 두세요. 첫 실행 때 Remotion이 렌더용 Chrome(약 100MB)을 내려받습니다.

```bash
npx remotion still MyIntro out/check.png --frame=100
```

`out/check.png`에 로고가 보이면 준비 완료입니다.

## 시작하기

```bash
git clone https://github.com/yongzu/phi-motion-study.git
```
```bash
cd phi-motion-study
```
```bash
npm install
```
```bash
npm run studio
```

브라우저에 Remotion Studio가 열리면 왼쪽 목록에서 `MyIntro`(내 작업)와 `Examples/Ref11Intro`(예시)를 볼 수 있습니다.

## 진행 순서

1. **레퍼런스 고르기:** 진행자가 준비한 영상 중 하나를 고릅니다. 고르기 전에 [`prompts/references.md`](prompts/references.md) 카탈로그를 보세요.
2. **의도 카드 쓰기 (5분):** [`prompts/01-intent-card.md`](prompts/01-intent-card.md)
3. **메타프롬프트로 지시:** [`prompts/02-meta-prompt.md`](prompts/02-meta-prompt.md)에 의도 카드를 붙여 Claude Code에 넣습니다. 작업 파일은 `src/MyIntro.tsx`입니다.
4. **스토리보드 확인 → 구현 → 스틸로 검토**
5. **렌더:** `npx remotion render MyIntro out/my-intro.mp4`

전체 흐름은 예시 [`prompts/examples/ref11.md`](prompts/examples/ref11.md)를 참고하세요.

## 구성

```
kit/                 공통 소스 (자세한 설명은 kit/README.md)
├── preview.html     소스와 글자·조각 id 한눈에 보기
├── svg/             마크, 마크 조각, 마크 링 2개, 워드마크
├── hero/            phi.design 히어로 3D 링 플레이어 + 키프레임 데이터
└── remotion/        Remotion에서 import 하는 파일 (2D path 데이터, 3D 링 컴포넌트)
src/
├── MyIntro.tsx      ← 참가자 작업 파일
├── Root.tsx         컴포지션 목록
└── examples/ref11/  예시 코드
prompts/             의도 카드, 메타프롬프트, 예시
examples/            예시 결과 영상
```

## 참고

- 레퍼런스 영상은 저작권이 있어서 저장소에 올리지 않습니다 (`.gitignore`의 `references/`, `*.mp4`).
- 3D 링은 WebGL을 씁니다. `remotion.config.ts`에서 `angle` GL 백엔드를 지정해 두었습니다.
- Windows에서는 저장소 경로가 너무 길면(약 260자 이상) 렌더용 Chrome이 실행되지 않습니다. `C:\Users\<이름>\phi-motion-study`처럼 짧은 경로에 클론하세요.
- `npm install` 때 나오는 `allow-scripts` 경고(esbuild)는 무시해도 됩니다. 설치와 렌더에 영향이 없습니다.
- 로고와 히어로 3D 데이터의 출처는 [phi.design](https://www.phi.design/)입니다. 스터디 목적으로 정리한 것입니다.
