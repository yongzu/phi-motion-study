# Phi Motion Study

> 이 파일은 AI 코딩 도우미(Claude Code 는 `CLAUDE.md`, Codex 는 `AGENTS.md`)가 자동으로 읽는 프로젝트 안내서입니다. 두 파일은 같은 내용으로 유지합니다.

Phi 로고로 5~8초 인트로 모션을 만드는 스터디 프로젝트입니다. 사용자는 대부분 디자이너이고 코드에 익숙하지 않습니다. 쉬운 말로 설명하세요.

## 작업 규칙
- 작업 파일은 `src/MyIntro.tsx` 하나입니다. 길이는 `src/Root.tsx`의 `MyIntro` `durationInFrames`로 맞춥니다. 1920×1080, 30fps.
- 소스는 `kit/`만 씁니다. 새 도형은 점·선·원 같은 기본 도형만 허용합니다.
  - 2D: `kit/remotion/phi-logo.ts` (`phiMark.rings` = ring-a, ring-b 타원 링 / `phiMark.d` = 원본 마크 / `phiWordmark.glyphs` = 글자 23개, id로 지칭)
  - 3D: `kit/remotion/PhiHeroRings.tsx` (`startAt="mark"`, `HERO_MARK_SCALE`, `HERO_MARK_POSE`로 2D → 3D 연결)
  - 자세한 설명: `kit/README.md`
- 레퍼런스 영상은 `references/`에 있지만 영상을 직접 볼 수 없습니다. `prompts/references.md`의 해당 번호 설명과 사용자의 설명을 기준으로 합니다.
- 진행 방식은 `prompts/02-meta-prompt.md`의 "작업 순서"를 따릅니다.
  1. 의도를 2문장으로 다시 말하고, 모호하면 질문 최대 3개
  2. 스토리보드 표를 먼저 보여주고 확인받은 뒤 구현
  3. 구현 후 핵심 프레임 스틸(`npx remotion still MyIntro out/f.png --frame=N`)로 스스로 검토
- 수정할 때마다 사용자가 입력한 명령을 커밋 메시지로 남깁니다 (`git commit`). 푸시는 하지 않습니다. 폴더가 Git 저장소가 아니면 (ZIP 으로 받은 경우) 커밋은 건너뜁니다.
- Mac 에서 Node.js 를 홈 폴더에 설치한 경우 명령 앞에 `export PATH="$HOME/.local/node/bin:$HOME/.local/bin:$PATH";` 를 붙입니다.
- 사용자가 "미리보기 열어줘"라고 하면 `npm run studio` 를 백그라운드로 실행하고 주소(보통 http://localhost:3000)를 알려줍니다. 직접 열 때는 폴더의 `preview.cmd`(Mac: `preview.command`)를 더블클릭하라고 안내합니다.
- "영상으로 만들어줘"라고 하면 `npx remotion render MyIntro out/my-intro.mp4` 를 실행합니다. (또는 `render.cmd` / `render.command` 더블클릭)
- 명령이 네트워크나 권한 문제로 막히면, 이유를 한 문장으로 설명하고 사용자에게 실행 승인을 요청합니다.
- 예시 코드: `src/examples/ref11/Ref11Intro.tsx` (점 → 선 → 타원 → 두 링 → 3D + 워드마크)
