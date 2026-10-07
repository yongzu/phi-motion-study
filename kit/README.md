# Phi Logo Kit

로고 인트로 모션 스터디에 쓸 공통 소스입니다. 모든 참가자가 같은 소스로 시작하고, 각자 고른 레퍼런스대로 움직임을 만듭니다.

> 먼저 `preview.html`을 브라우저로 여세요. 글자나 조각에 마우스를 올리면 **id**가 보입니다. 프롬프트에서는 이 id로 지시하면 됩니다.

## 구성

```
kit/
├── preview.html            ← 소스와 id 한눈에 보기 (더블클릭으로 열기)
├── svg/
│   ├── phi-mark.svg         마크 원본 (채움, 구멍 포함)
│   ├── phi-mark-parts.svg   마크를 윤곽선 6조각으로 나눈 것
│   ├── phi-mark-rings.svg   마크를 타원 링 2개로 재구성한 것  ★ 모션용 추천
│   └── phi-wordmark.svg     워드마크, 글자별 id 23개
├── hero/                    ← phi.design 히어로의 3D 링 모션
│   ├── player.html          브라우저로 열어 보는 플레이어 (재생, 진행도 조절, solid/line 전환)
│   └── hero-rings.json      원본 키프레임 데이터 (참고용)
└── remotion/                ← Remotion에서 import 하는 파일
    ├── phi-logo.ts          2D path 데이터 (마크, 워드마크)
    ├── PhiHeroRings.tsx     3D 링 컴포넌트 + 2D↔3D 연결용 상수
    ├── phi-hero-rings.js    three.js 모듈 (키프레임 데이터 포함)
    └── phi-hero-rings.d.ts  TypeScript 타입
```

- 모든 SVG에서 고정 크기와 늘어남(`preserveAspectRatio="none"`)을 없애고 `viewBox`만 남겼습니다.
- 색은 모두 검정(`#000`)입니다. 검정 배경에서 쓸 때는 흰색으로 바꾸세요.

## 마크: 세 가지 버전

| 파일 | 구조 | 이럴 때 |
|---|---|---|
| `phi-mark.svg` | path 1개 (`fill-rule="evenodd"`) | 마지막 프레임, 채움 등장 |
| `phi-mark-parts.svg` | 윤곽 6개: `outline`, `petal-ne`, `petal-nw`, `petal-sw`, `petal-se`, `core` | 윤곽선을 따라 그리기, 조각별 등장 |
| `phi-mark-rings.svg` | 타원 링 2개: `ring-a`, `ring-b` | **회전, 궤도, 링 하나씩 그리기, 링 교차** |

**마크는 두 개의 타원 링이 교차하는 형태입니다.** 원본 윤곽을 분석해 보니 바깥선이 정확히 타원이었습니다(오차 0.03px). 그래서 `stroke-width 54.7`짜리 타원 2개로 재구성했습니다.
- `ring-a`: NE↔SW 방향, 길고 가늘다 (rx 170.98, ry 492.83, 45° 회전)
- `ring-b`: NW↔SE 방향, 짧고 넓다 (rx 237.88, ry 461.10, −45° 회전)
- 원본과의 차이는 가장자리에서 1px 안팎입니다. 그래도 마지막 정지 프레임은 `phi-mark.svg`로 바꿔 두는 게 안전합니다.
- 두 링은 교차점에서 겹칩니다. 반투명으로 칠하면 겹친 부분이 진해지니, 투명도는 링을 감싼 그룹에 주세요.
- 각 링의 `d`는 긴 축의 위쪽 끝에서 시작해 시계방향으로 돕니다. 선 그리기(`evolvePath`)를 걸면 끝에서부터 그려집니다.

## 워드마크: 글자별 id

세 줄 구조입니다. `i`는 점(`-dot`)과 기둥이 따로 분리되어 있습니다.

| 줄 | 글자 id (읽는 순서) |
|---|---|
| `line-1` Phi | `P` `h` `i1-dot` `i1` |
| `line-2` Institute of | `I` `n1` `s1` `t1` `i2-dot` `i2` `t2` `u` `t3` `e1` `o` `f` |
| `line-3` Design | `D` `e2` `s2` `i3-dot` `i3` `g` `n2` |

`phiWordmark.glyphs`는 위 순서대로 정렬되어 있어서, 배열 index를 그대로 순차 등장(stagger) 딜레이로 쓸 수 있습니다.

## Remotion에서 쓰기

이 저장소의 `src/`에서는 `../kit/remotion/phi-logo`로 import 합니다. 다른 프로젝트에서 쓸 때는 `remotion/` 폴더를 통째로 복사하세요.

```tsx
import { evolvePath } from '@remotion/paths';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { phiMark, phiWordmark } from './phi-logo';

const ease = Easing.bezier(0.35, 0, 0, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const Example = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#000', alignItems: 'center', justifyContent: 'center', gap: 80, flexDirection: 'row' }}>
      {/* 링 두 개를 시간차로 그리기 */}
      <svg viewBox={phiMark.viewBox} width={420} height={420}>
        {phiMark.rings.map((r, i) => {
          const p = interpolate(frame, [i * 12, i * 12 + 45], [0, 1], { ...clamp, easing: ease });
          const { strokeDasharray, strokeDashoffset } = evolvePath(p, r.d);
          return (
            <path key={r.id} d={r.d} fill="none" stroke="#fff" strokeWidth={r.strokeWidth}
              strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
          );
        })}
      </svg>
      {/* 글자를 한 자씩 올리기 */}
      <svg viewBox={phiWordmark.viewBox} width={480} style={{ overflow: 'visible' }}>
        {phiWordmark.glyphs.map((g, i) => {
          const p = interpolate(frame, [40 + i * 2, 40 + i * 2 + 20], [0, 1], { ...clamp, easing: ease });
          return <path key={g.id} d={g.d} fill="#fff" opacity={p} transform={`translate(0 ${(1 - p) * 4})`} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
```

이 저장소에는 이미 설치돼 있습니다. 다른 Remotion 프로젝트에 가져갈 때만 설치하세요.

```bash
npm i @remotion/paths
```

`@remotion/paths`에는 `evolvePath`(선 그리기), `getLength`, `getPointAtLength`(path 위를 따라 움직이기), `interpolatePath`(모양 모핑)가 들어 있습니다.

## 히어로 3D 링 모션 (`hero/`)

phi.design 첫 화면에서 돌아가는 링은 영상이 아니라 **three.js로 실시간 렌더링되는 3D 모델**입니다. 사이트 코드에 있던 데이터와 계산을 그대로 옮겼습니다.

**어떻게 계산되나**
1. **모양:** 링 2개(`big`, `small`)는 각각 Blender 베지어 곡선(조절점 4개)을 따라 만든 튜브입니다. 두께(bevel)는 big이 0.054~0.06 사이에서 변하고, small은 0.09로 고정입니다.
2. **움직임:** 공식으로 계산하지 않습니다. **Blender에서 구운(bake) 키프레임 151장**(30fps, 5초)에 프레임마다 회전(쿼터니언), 크기, 위치, 두께가 들어 있고, 프레임 사이는 보간합니다(회전은 slerp, 나머지는 lerp).
3. **재생 타이밍:** 0.6초 동안 가속하고, 등속으로 돌다가, 0.65초 동안 감속합니다. 5.61초마다 반복합니다. big 링은 끝 자세가 시작 자세를 뒤집은 모양이라, 홀수 번째 반복마다 `seam_op` 회전을 곱해서 이음매 없이 이어 붙입니다.
4. **보이는 방식:** 정사영 카메라, 검은 금속 재질(`#101010`), 반구광 + 방향광 하나.
   - `line` 스타일은 사이트에서 마우스를 올렸을 때 나오는 선화 모드입니다. 법선(normal)을 렌더링한 뒤 실루엣과 꺾인 곳을 검출해서 선으로 칠합니다.
5. **마지막 자세는 2D 마크(두 타원의 교차)와 거의 같습니다.** 한쪽 링(ring-a)만 3D 쪽이 조금 더 가늘어서, 정확한 값을 `HERO_MARK_POSE`로 넣어 두었습니다.

**쓰는 법**
- **보기만 할 때:** `hero/player.html`을 브라우저로 여세요. three.js를 CDN에서 불러오므로 인터넷 연결이 필요합니다.
- **Remotion에서 쓸 때:** `remotion/PhiHeroRings.tsx`를 import 합니다 (같은 폴더의 `phi-hero-rings.js`를 씁니다).

다른 Remotion 프로젝트에 가져갈 때만 설치하세요 (이 저장소에는 이미 있음).

```bash
npm i three@0.184.0 @types/three
```

```tsx
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { PhiHeroRings } from './PhiHeroRings';

// 1) 사이트와 똑같이 돌리기
<PhiHeroRings size={800} />

// 2) 타이밍을 직접 설계하기: 키프레임은 그대로 두고 "시간 → 진행도"만 내가 정한다
const frame = useCurrentFrame();
<PhiHeroRings size={800} style="line"
  progress={interpolate(frame, [0, 90], [0, 1], { extrapolateRight: 'clamp', easing: Easing.bezier(0.35, 0, 0, 1) })} />
```

**2D → 3D로 이어 붙이기**

`startAt="mark"`를 주면 3D 링이 마크 자세에서 정지 상태로 출발해 가속하며 돌기 시작합니다. 실제 예시는 `src/examples/ref11/Ref11Intro.tsx`에 있습니다.

```tsx
import { HERO_MARK_POSE, HERO_MARK_SCALE, PhiHeroRings } from '../kit/remotion/PhiHeroRings';

// 2D 마크가 완성된 프레임부터 3D로 교체
<Sequence from={102} layout="none">
  <PhiHeroRings size={markSize * HERO_MARK_SCALE} startAt="mark" speed={1.5} />
</Sequence>
```

- **크기:** 3D 캔버스 크기 = 2D 마크 크기 × `HERO_MARK_SCALE`(1.49). 중심을 맞춰 겹치면 됩니다.
- **모양:** 3D 링의 멈춘 자세를 2D 마크 좌표로 옮긴 타원이 `HERO_MARK_POSE`입니다. ring-b는 2D와 거의 같지만 ring-a는 3D 쪽이 더 가늘고(rx 171 → 123), 보이는 두께도 54.7 → 48로 다릅니다.
  - 교체 전 10프레임 동안 2D 링(`<ellipse>`)을 이 값으로 보간하고, 4프레임 크로스페이드하면 이음매가 보이지 않습니다. 두 프레임을 겹쳐 비교해서 확인했습니다.
- **멈추기:** 한 바퀴를 다 돌면 다시 마크 자세로 멈춥니다. 시점은 `5.61초 ÷ speed` 뒤입니다(`speed=1.5`면 112프레임 뒤). 이후에는 `<Freeze>`로 고정하세요. 그대로 두면 다음 바퀴가 시작됩니다.

- WebGL을 쓰므로 이 저장소의 `remotion.config.ts`는 `angle` GL 백엔드를 지정합니다. 다른 프로젝트에서 화면이 까맣게 나오면 `--gl=angle`부터 확인하세요.
- 저수준 API(`createPhiHero`, `heroProgressAt`, `renderProgress`)를 직접 쓰면 링 메시(`rings.big`, `rings.small`)에 접근해서 재질, 색, 추가 회전을 바꿀 수 있습니다.

## 프롬프트

의도 카드와 메타프롬프트는 저장소의 [`prompts/`](../prompts) 폴더에 있습니다. 소스를 지칭할 때는 위 표의 id를 그대로 쓰세요.

> 예) `ring-a`가 먼저 그려지고, 0.2초 뒤 `ring-b`가 그려진다. 둘 다 `cubic-bezier(0.35, 0, 0, 1)`, 0.8초.
> 그다음 `line-1` → `line-2` → `line-3` 순서로 글자가 아래에서 올라온다. `i`의 점(`*-dot`)은 기둥보다 0.1초 늦게 떨어진다.

## 출처

- 마크: `https://www.phi.design/img/phi/logo-mark-mobile.svg`
- 워드마크: `https://www.phi.design/img/phi/logo-wordmark-desktop-tablet.svg`
- 히어로 링: phi.design 히어로 섹션의 three.js 코드와 키프레임 데이터 (2026-10-06 기준)
- 스터디 목적으로 정리한 것입니다. 스터디 밖에서 쓰려면 브랜드 사용 범위를 확인하세요.
