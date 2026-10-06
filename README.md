# Phi Motion Study

Phi 로고 인트로 모션 스터디 자료입니다. **모두 같은 소스로 시작하고, 각자 고른 레퍼런스와 자기 의도를 담아** 짧은 로고 인트로를 만듭니다.

> 예시 결과물: [`examples/ref11-intro.mp4`](examples/ref11-intro.mp4) (8초)
> 2D로 분해·조립된 마크가 3D로 깨어나 회전하고, 흩어졌던 점에서 워드마크가 다시 자랍니다.

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

1. **레퍼런스 고르기:** 진행자가 준비한 영상 중 하나를 고릅니다.
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
- 로고와 히어로 3D 데이터의 출처는 [phi.design](https://www.phi.design/)입니다. 스터디 목적으로 정리한 것입니다.
