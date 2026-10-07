// 예시: Reference_Video_11 (상태바 → 로딩 심볼 Copy Study) + 3D 전환 + 워드마크
//
// 의도: 점 하나(가장 작은 기본 요소)가 선이 되고, 선이 타원이 되고, 타원이 돌며 둘로 나뉘어
//       하나의 생각(마크)이 된다. 그 생각이 입체로 깨어나며 이름(워드마크)을 얻는다. — Fundamentals Over Tools
//
// 1막 (2D, 11번의 원리: 한 요소가 모양을 바꾸며 다음 형태로 이어진다)
//      점 → 세로로 길어져 선 → 옆으로 벌어져 타원 → 회전하며 두 타원(ring-a, ring-b)으로 나뉨
// 다리  2D 링을 3D 링의 멈춘 자세(HERO_MARK_POSE)로 보간 → 3D로 교체
// 2막  3D로 회전하며 왼쪽으로 비켜서고, 오른쪽에 워드마크가 한 번에 아래에서 올라오며 나타남
//
// 모든 도형은 하나의 <ellipse> 다. 점 = rx·ry 가 0 에 가까운 타원, 선 = rx 만 0 에 가까운 타원.
//
// Ref11IntroCamera: 같은 장면에 카메라를 더한 버전 (오브젝트는 그대로, 카메라만 일한다)
//   ① 점에 5배로 붙어 시작 → 선·타원이 커지는 동안 뒤로 빠짐
//   ② 마크는 제자리, 카메라가 마크를 크게 보다가 빠지며 오른쪽으로 패닝 → 워드마크가 드러남
import { AbsoluteFill, Easing, Freeze, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { phiMark, phiWordmark } from '../../../kit/remotion/phi-logo';
import { HERO_MARK_POSE, HERO_MARK_SCALE, PhiHeroRings } from '../../../kit/remotion/PhiHeroRings';
import { HERO_TIMING } from '../../../kit/remotion/phi-hero-rings';

// ---------- 타이밍 (프레임, 30fps) ----------
export const REF11_DURATION = 240;
const T = {
  pop: 0, // 점이 나타남
  stretch: [14, 30], // 점 → 세로 선
  open: [32, 50], // 선 → 타원
  split: [46, 86], // 타원이 회전하며 둘로 나뉨
  toPose: [90, 102], // 2D 링 → 3D 링이 멈춘 자세 (모양·두께)
  handoff: [102, 106], // 2D → 3D 크로스페이드
  move3d: [130, 160], // 3D 마크가 왼쪽 로크업 자리로
  word: [136, 162], // 워드마크가 아래에서 올라오며 나타남
} as const;

const EASE_FUNDAMENTAL = Easing.bezier(0.83, 0, 0.17, 1); // 11번의 강한 가속·감속
const EASE_EXPAND = Easing.bezier(0.35, 0, 0, 1); // Phi 인트로 이징
const EASE_CAMERA = Easing.bezier(0.45, 0, 0.2, 1); // 카메라: 오브젝트보다 부드럽게

// ---------- 카메라 (Ref11IntroCamera) ----------
// 오브젝트보다 2~4 프레임 늦게 따라간다. 줌은 로그 공간에서 보간해야 일정한 속도로 느껴진다.
const CAM = {
  openZoom: 5, // 점에 붙어 있는 배율
  markZoom: 1.35, // 마크만 크게 보는 배율 (워드마크가 드러나기 전)
  pullOut: [17, 58], // ① 점 → 마크 (stretch·open 보다 3프레임 늦게)
  reveal: [128, 170], // ② 마크 → 로크업 (빠지며 오른쪽으로)
  pixelRatio: 2, // 3D 가 보이는 동안의 최대 줌(1.35) 이상
} as const;

// ---------- 레이아웃 ----------
const BG = '#F5F5F3';
const INK = '#141414';
const M = 360; // 2D 마크 크기(px) — viewBox 800
const K = M / 800; // 마크 단위 → px
const S3 = M * HERO_MARK_SCALE; // 3D 캔버스 크기
const HERO_SPEED = 1.5;
const HERO_LOOP_FRAMES = Math.floor((HERO_TIMING.loopMs / HERO_SPEED / 1000) * 30); // 한 바퀴 → 마크 자세로 정지
const WM_K = M / phiWordmark.height; // 워드마크 단위 → px (워드마크 높이 = 마크 높이)
const GAP = M * 0.24;
const LOCKUP_W = M + GAP + phiWordmark.width * WM_K;
const LOCKUP_X = (1920 - LOCKUP_W) / 2;
const MARK_HOME = { x: LOCKUP_X + M / 2, y: 540 };
const MARK_CENTER = { x: 960, y: 540 };
const WM = { x: LOCKUP_X + M + GAP, y: 540 - M / 2 };
const WORD_RISE = 48; // 워드마크가 올라오는 거리(px)

// ---------- 링 ----------
type Ellipse = { cx: number; cy: number; rx: number; ry: number; rotate: number; w: number };
type Ring = (typeof phiMark.rings)[number];
const RING_A = phiMark.rings.find((r) => r.id === 'ring-a')!;
const RING_B = phiMark.rings.find((r) => r.id === 'ring-b')!;

// 갈라지기 직전의 타원 하나: 두 링의 중간 모양, 세로로 선 상태
const SEED: Ellipse = {
  cx: 400,
  cy: 400,
  rx: (RING_A.rx + RING_B.rx) / 2,
  ry: (RING_A.ry + RING_B.ry) / 2,
  rotate: 0,
  w: RING_A.strokeWidth,
};
const TINY = 0.5; // 0 이면 SVG 가 타원을 그리지 않으므로 아주 작은 값
// 회전하며 나뉨: 둘 다 시계방향으로 돌되 도는 양이 달라 벌어진다 (타원은 180° 대칭이라 225° = 45°, 135° = −45°)
const SPIN: Record<Ring['id'], number> = { 'ring-a': RING_A.rotate + 180, 'ring-b': RING_B.rotate + 180 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpEllipse = (a: Ellipse, b: Ellipse, t: number): Ellipse => ({
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
  rx: lerp(a.rx, b.rx, t),
  ry: lerp(a.ry, b.ry, t),
  rotate: lerp(a.rotate, b.rotate, t),
  w: lerp(a.w, b.w, t),
});
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const iv = (f: number, [a, b]: readonly [number, number], [c, d]: [number, number], easing?: (t: number) => number) =>
  interpolate(f, [a, b], [c, d], { ...clamp, easing });

/** f 프레임에서 링 하나의 모양 (마크 좌표, viewBox 800) */
function ringAt(f: number, ring: Ring, popScale: number): Ellipse {
  const stretch = iv(f, T.stretch, [0, 1], EASE_FUNDAMENTAL);
  const open = iv(f, T.open, [0, 1], EASE_FUNDAMENTAL);
  const split = iv(f, T.split, [0, 1], EASE_FUNDAMENTAL);
  const toPose = iv(f, T.toPose, [0, 1], EASE_EXPAND);
  // 점 → 선 → 타원
  let e: Ellipse = { ...SEED, rx: lerp(TINY, SEED.rx, open), ry: lerp(TINY, SEED.ry, stretch), w: SEED.w * popScale };
  // 회전하며 제 모양으로
  e = lerpEllipse(e, { cx: ring.cx, cy: ring.cy, rx: ring.rx, ry: ring.ry, rotate: SPIN[ring.id], w: ring.strokeWidth }, split);
  // 3D 링의 멈춘 자세로
  const pose = HERO_MARK_POSE[ring.id];
  return lerpEllipse(e, { ...pose, rotate: pose.rotate + 180, w: pose.strokeWidth }, toPose);
}

const LOCKUP_CENTER = { x: 960, y: 540 };
const logLerp = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));
function cameraAt(f: number) {
  const pull = iv(f, CAM.pullOut, [0, 1], EASE_CAMERA);
  const reveal = iv(f, CAM.reveal, [0, 1], EASE_CAMERA);
  const zoom = f < CAM.reveal[0] ? logLerp(CAM.openZoom, CAM.markZoom, pull) : logLerp(CAM.markZoom, 1, reveal);
  return { fx: lerp(MARK_HOME.x, LOCKUP_CENTER.x, reveal), fy: 540, zoom };
}

export const Ref11Intro: React.FC = () => <Ref11Scene camera={false} />;
export const Ref11IntroCamera: React.FC = () => <Ref11Scene camera />;

const Ref11Scene: React.FC<{ camera: boolean }> = ({ camera }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = Math.max(0, spring({ frame: f - T.pop, fps, config: { damping: 12, mass: 0.5 } }));
  // 카메라 버전: 마크는 처음부터 로크업 자리에 있고 움직이지 않는다 (카메라가 대신 움직임)
  const c = camera ? MARK_HOME : { x: lerp(MARK_CENTER.x, MARK_HOME.x, iv(f, T.move3d, [0, 1], EASE_EXPAND)), y: MARK_CENTER.y };
  const cam = camera ? cameraAt(f) : { fx: 960, fy: 540, zoom: 1 };
  const mark2dOpacity = iv(f, T.handoff, [1, 0]);
  const mark3dOpacity = iv(f, T.handoff, [0, 1]);
  const word = iv(f, T.word, [0, 1], EASE_EXPAND);
  const lineOpacity = iv(f, [T.open[0] + 2, T.open[0] + 8], [1, 0]);

  return (
    <AbsoluteFill style={{ background: BG }}>
      <AbsoluteFill style={{
        transformOrigin: '0 0',
        transform: `translate(960px, 540px) scale(${cam.zoom}) translate(${-cam.fx}px, ${-cam.fy}px)`,
      }}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
          {/* 1막: 점 → 선 → 타원 → 회전하며 둘로 */}
          {mark2dOpacity > 0 && (
            <g opacity={mark2dOpacity} transform={`translate(${c.x - 400 * K} ${c.y - 400 * K}) scale(${K})`} fill="none" stroke={INK}>
              {/* 점·선 구간: 아주 납작한 타원은 끝이 각져 보이므로 둥근 끝 선으로 그리고, 타원이 벌어지기 시작하면 넘긴다 */}
              {lineOpacity > 0 && (() => {
                const e = ringAt(f, RING_A, pop);
                return (
                  <line x1={e.cx} y1={e.cy - e.ry} x2={e.cx} y2={e.cy + e.ry}
                    strokeWidth={e.w} strokeLinecap="round" opacity={lineOpacity} />
                );
              })()}
              {f >= T.open[0] &&
                [RING_B, RING_A].map((r) => {
                  const e = ringAt(f, r, pop);
                  return <ellipse key={r.id} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} strokeWidth={e.w} transform={`rotate(${e.rotate} ${e.cx} ${e.cy})`} />;
                })}
            </g>
          )}

          {/* 2막 워드마크: 한 번에, 아래에서 위로 올라오며 투명 → 불투명 */}
          {word > 0 && (
            <g opacity={word} transform={`translate(${WM.x} ${WM.y + (1 - word) * WORD_RISE}) scale(${WM_K})`} fill={INK}>
              {phiWordmark.glyphs.map((g) => (
                <path key={g.id} d={g.d} />
              ))}
            </g>
          )}
        </svg>

        {/* 2막: 3D 링 — 마크 자세에서 깨어나 한 바퀴(5.61초 ÷ 1.5) 돌고 다시 마크 자세로 멈춘다 */}
        <Sequence from={T.handoff[0]} layout="none">
          <div style={{ position: 'absolute', left: c.x - S3 / 2, top: c.y - S3 / 2, opacity: mark3dOpacity }}>
            <Freeze frame={HERO_LOOP_FRAMES} active={f - T.handoff[0] >= HERO_LOOP_FRAMES}>
              <PhiHeroRings size={S3} startAt="mark" speed={HERO_SPEED} pixelRatio={camera ? CAM.pixelRatio : 1} />
            </Freeze>
          </div>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
