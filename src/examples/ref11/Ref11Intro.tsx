// 예시: Reference_Video_11 (상태바 → 로딩 심볼 Copy Study) + 3D 전환 + 워드마크
//
// 의도: 흩어진 기본 요소(점·선·원)가 모여 하나의 생각(마크)이 되고,
//       그 생각이 입체로 깨어나며 이름(워드마크)을 얻는다. — Fundamentals Over Tools
//
// 1막 (2D, 11번의 원리)  글자 → i의 점으로 압축, 'I' → 휘어 궤도를 돌며 ring-b, 점이 빈틈에 안착
// 다리                   2D 링을 3D 링의 멈춘 자세(HERO_MARK_POSE)로 보간 → 3D로 교체
// 2막 (3D)               마크 자세에서 깨어나 회전, 왼쪽으로 비켜서며 점에서 워드마크가 다시 자람
import { AbsoluteFill, Easing, Freeze, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { getBoundingBox, getLength, getPointAtLength } from '@remotion/paths';
import { phiMark, phiWordmark } from '../../../kit/remotion/phi-logo';
import { HERO_MARK_POSE, HERO_MARK_SCALE, PhiHeroRings } from '../../../kit/remotion/PhiHeroRings';
import { HERO_TIMING } from '../../../kit/remotion/phi-hero-rings';

// ---------- 타이밍 (프레임, 30fps) ----------
export const REF11_DURATION = 240;
const T = {
  collapse: [18, 33], // 글자 → 점
  ringaMove: [36, 69], // ring-a 가 중앙으로
  bend: [36, 48], // 'I' 막대가 휘어 원호로
  orbit: [38, 72], // 원호가 ring-b 궤도를 돌며 길어짐
  dotsStart: 51, // 점이 빈틈으로 출발
  dotStagger: 3,
  dotDur: 24,
  close: [84, 92], // 빈틈이 닫히며 점이 선에 녹아듦
  toPose: [90, 102], // 2D 링 → 3D 링이 멈춘 자세 (모양·두께)
  handoff: [102, 106], // 2D → 3D 크로스페이드
  move3d: [132, 162], // 3D 마크가 왼쪽 로크업 자리로
  regrowDots: [132, 140], // 점이 먼저 나타남
  regrow: 138, // 점에서 글자가 다시 자람 (줄마다 +4)
  regrowLineStagger: 4,
  regrowDur: 16,
} as const;

const EASE_FUNDAMENTAL = Easing.bezier(0.83, 0, 0.17, 1); // 11번의 강한 가속·감속
const EASE_EXPAND = Easing.bezier(0.35, 0, 0, 1); // Phi 인트로 이징

// ---------- 레이아웃 ----------
const BG = '#F5F5F3';
const INK = '#141414';
const M = 360; // 2D 마크 크기(px) — viewBox 800
const K = M / 800; // 마크 단위 → px
const RING_W = phiMark.rings[0].strokeWidth; // 54.7 (마크 단위)
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

type Pt = { x: number; y: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const iv = (f: number, [a, b]: readonly [number, number], [c, d]: [number, number], easing?: (t: number) => number) =>
  interpolate(f, [a, b], [c, d], { ...clamp, easing });
const markToScreen = (p: Pt, c: Pt): Pt => ({ x: c.x + (p.x - 400) * K, y: c.y + (p.y - 400) * K });
const wmToScreen = (p: Pt): Pt => ({ x: WM.x + p.x * WM_K, y: WM.y + p.y * WM_K });

// ---------- ring-b 를 길이로 찾는 표 (마크 단위) ----------
const RING_A = phiMark.rings.find((r) => r.id === 'ring-a')!;
const RING_B = phiMark.rings.find((r) => r.id === 'ring-b')!;
const L = getLength(RING_B.d);
const LUT_N = 2048;
const LUT: Pt[] = Array.from({ length: LUT_N + 1 }, (_, i) => getPointAtLength(RING_B.d, (L * i) / LUT_N)!);
const ringB = (s: number): Pt => {
  const u = ((((s % L) + L) % L) / L) * LUT_N;
  const i = Math.floor(u);
  return lerpPt(LUT[i], LUT[Math.min(i + 1, LUT_N)], u - i);
};
// ring-b 에서 가장 오른쪽 지점 = 막대가 처음 휘어 붙는 자리
const S_EAST = (LUT.reduce((best, p, i) => (p.x > LUT[best].x ? i : best), 0) / LUT_N) * L;
const GAP_LEN = 0.15 * L; // 점이 들어갈 빈틈 (SE 끝, s = L/2 중심)

// ---------- 워드마크 글자 정보 ----------
const glyphs = phiWordmark.glyphs.map((g) => {
  const b = getBoundingBox(g.d);
  return { ...g, c: { x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 }, b };
});
const LINE_DOT: Record<string, string> = { 'line-1': 'i1-dot', 'line-2': 'i2-dot', 'line-3': 'i3-dot' };
const LINES = ['line-1', 'line-2', 'line-3'] as const;
const dotOf = (line: string) => glyphs.find((g) => g.id === LINE_DOT[line])!;
const R_DOT = 1.1 * WM_K;

// 'I' 막대 (화면 px)
const I = glyphs.find((g) => g.id === 'I')!;
const STICK_W = (I.b.x2 - I.b.x1) * WM_K;
const STICK_TOP = wmToScreen({ x: I.c.x, y: I.b.y1 + (I.b.x2 - I.b.x1) / 2 }); // 둥근 끝 반지름만큼 안쪽
const STICK_BOT = wmToScreen({ x: I.c.x, y: I.b.y2 - (I.b.x2 - I.b.x1) / 2 });
const STICK_LEN = STICK_BOT.y - STICK_TOP.y;
const ARC_LEN0 = STICK_LEN / K; // 같은 길이의 원호 (마크 단위)

// 점의 출발점과 도착점: 빈틈에 가까운 점부터 출발
const GAP_SCREEN = markToScreen(ringB(L / 2), MARK_CENTER);
const FINAL_SEG = { a: -0.5 * L + GAP_LEN / 2, b: 0.5 * L - GAP_LEN / 2 };
const dots = LINES.map((line) => ({ line, from: wmToScreen(dotOf(line).c) }))
  .map((d) => ({ ...d, dist: Math.hypot(d.from.x - GAP_SCREEN.x, d.from.y - GAP_SCREEN.y) }))
  .sort((p, q) => p.dist - q.dist)
  .map((d, order) => ({
    ...d,
    order,
    to: markToScreen(ringB(L / 2 + (order - 1) * (GAP_LEN / 4)), MARK_CENTER),
  }));

const markCenterAt = (f: number): Pt => {
  if (f < T.move3d[0]) return lerpPt(MARK_HOME, MARK_CENTER, iv(f, T.ringaMove, [0, 1], EASE_FUNDAMENTAL));
  return lerpPt(MARK_CENTER, MARK_HOME, iv(f, T.move3d, [0, 1], EASE_EXPAND));
};

// ---------- 1막: 'I' → 원호 → ring-b ----------
const N = 181;
function morphingStroke(f: number, c: Pt) {
  const m = iv(f, T.bend, [0, 1], EASE_FUNDAMENTAL);
  const o = iv(f, T.orbit, [0, 1], EASE_FUNDAMENTAL);
  const cl = iv(f, T.close, [0, 1], EASE_FUNDAMENTAL);
  // 원호 구간 [a, b] — 시작: 오른쪽 끝에 막대 길이만큼 → 궤도를 돌아 빈틈만 남김 → 빈틈이 닫힘
  let a = lerp(S_EAST - ARC_LEN0 / 2, FINAL_SEG.a, o);
  let b = lerp(S_EAST + ARC_LEN0 / 2, FINAL_SEG.b, o);
  a = lerp(a, -0.5 * L, cl);
  b = lerp(b, 0.5 * L, cl);
  const pts: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const stick = lerpPt(STICK_TOP, STICK_BOT, t); // 위→아래 = ring-b 시계방향(a→b)
    const arc = markToScreen(ringB(lerp(a, b, t)), c);
    pts.push(lerpPt(stick, arc, m));
  }
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('');
  return { d, w: lerp(STICK_W, RING_W * K, m) };
}

const quad = (p0: Pt, p1: Pt, p2: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
  y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y,
});

export const Ref11Intro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = markCenterAt(f);
  // 2D 링 → 3D 링이 멈춘 자세: 모양·위치·두께를 보간해 이음매 없이 3D로 넘긴다
  const toPose = iv(f, T.toPose, [0, 1], EASE_EXPAND);
  const ring2d = (r: typeof RING_A) => {
    const p = HERO_MARK_POSE[r.id];
    return {
      cx: lerp(r.cx, p.cx, toPose),
      cy: lerp(r.cy, p.cy, toPose),
      rx: lerp(r.rx, p.rx, toPose),
      ry: lerp(r.ry, p.ry, toPose),
      rotate: lerp(r.rotate, p.rotate, toPose),
      w: lerp(r.strokeWidth, p.strokeWidth, toPose),
    };
  };
  const mark2dOpacity = iv(f, T.handoff, [1, 0]);
  const mark3dOpacity = iv(f, T.handoff, [0, 1]);
  const markTransform = `translate(${c.x - 400 * K} ${c.y - 400 * K}) scale(${K})`;

  // 워드마크: 1막에서 접히고(collapse) 2막에서 다시 자란다(regrow). p=0 원래 자리, p=1 점으로 접힘
  const glyphP = (g: (typeof glyphs)[number], idx: number) => {
    const line = LINES.indexOf(g.line);
    if (f < T.move3d[0]) {
      const j = idx * 0.35;
      return iv(f, [T.collapse[0] + j, T.collapse[1] - 4 + j], [0, 1], EASE_FUNDAMENTAL);
    }
    const s = T.regrow + line * T.regrowLineStagger;
    return iv(f, [s, s + T.regrowDur], [1, 0], EASE_EXPAND);
  };

  return (
    <AbsoluteFill style={{ background: BG }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
        {/* 워드마크 */}
        <g transform={`translate(${WM.x} ${WM.y}) scale(${WM_K})`} fill={INK}>
          {glyphs.map((g, idx) => {
            if (g.part === 'dot') return null;
            // 'I' 는 1막에서 막대가 되어 떠나고, 2막에서 다시 자란다
            if (g.id === 'I' && f >= T.bend[0] && f < T.regrow) return null;
            const p = g.id === 'I' && f < T.bend[0] ? 0 : glyphP(g, idx);
            if (p >= 0.999) return null;
            const dot = dotOf(g.line).c;
            const tx = (dot.x - g.c.x) * p;
            const ty = (dot.y - g.c.y) * p;
            const s = 1 - 0.92 * p;
            return (
              <path
                key={g.id}
                d={g.d}
                opacity={interpolate(p, [0.7, 1], [1, 0], clamp)}
                transform={`translate(${g.c.x + tx} ${g.c.y + ty}) scale(${s}) translate(${-g.c.x} ${-g.c.y})`}
              />
            );
          })}
          {/* i 의 점 (원본 글리프): 1막 시작에 원으로 바뀌고, 2막 끝에 다시 돌아온다 */}
          {LINES.map((line) => {
            const g = dotOf(line);
            const back = T.regrow + LINES.indexOf(line) * T.regrowLineStagger + T.regrowDur - 6;
            const op = f < T.move3d[0] ? iv(f, [T.collapse[0], T.collapse[0] + 6], [1, 0]) : iv(f, [back, back + 6], [0, 1]);
            return op > 0 ? <path key={g.id} d={g.d} opacity={op} /> : null;
          })}
        </g>

        {/* 1막의 점 3개: 압축 → 곡선 이동 → 빈틈 안착 → 선에 녹아듦 / 2막: 다시 나타나 글자의 씨앗이 됨 */}
        {dots.map((d) => {
          if (f < T.move3d[0]) {
            const start = T.dotsStart + d.order * T.dotStagger;
            const t = spring({ frame: f - start, fps, durationInFrames: T.dotDur, config: { damping: 11, mass: 0.6 } });
            const ctrl = { x: (d.from.x + d.to.x) / 2 + 80, y: Math.max(d.from.y, d.to.y) + 200 };
            const pos = quad(d.from, ctrl, d.to, t);
            const r = f < T.close[0] ? iv(f, [T.collapse[0], T.collapse[0] + 8], [0, R_DOT], EASE_FUNDAMENTAL) : iv(f, T.close, [R_DOT, (RING_W * K) / 2]);
            const op = iv(f, [T.close[1] - 3, T.close[1]], [1, 0]);
            return op > 0 ? <circle key={d.line} cx={pos.x} cy={pos.y} r={r} fill={INK} opacity={op} /> : null;
          }
          const line = LINES.indexOf(d.line as (typeof LINES)[number]);
          const back = T.regrow + line * T.regrowLineStagger + T.regrowDur - 6;
          const r = iv(f, T.regrowDots, [0, R_DOT], EASE_EXPAND);
          const op = iv(f, [back, back + 6], [1, 0]);
          return op > 0 ? <circle key={d.line} cx={d.from.x} cy={d.from.y} r={r} fill={INK} opacity={op} /> : null;
        })}

        {/* 2D 마크 */}
        {mark2dOpacity > 0 && (
          <g opacity={mark2dOpacity} transform={markTransform} fill="none" stroke={INK}>
            {[RING_A, ...(f >= T.close[1] ? [RING_B] : [])].map((r) => {
              const e = ring2d(r);
              return <ellipse key={r.id} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} strokeWidth={e.w} transform={`rotate(${e.rotate} ${e.cx} ${e.cy})`} />;
            })}
          </g>
        )}
        {f >= T.bend[0] && f < T.close[1] && (() => {
          const s = morphingStroke(f, c);
          return <path d={s.d} fill="none" stroke={INK} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" />;
        })()}
      </svg>

      {/* 2막: 3D 링 — 마크 자세에서 깨어나 한 바퀴(5.61초 ÷ 1.5) 돌고 다시 마크 자세로 멈춘다 */}
      <Sequence from={T.handoff[0]} layout="none">
        <div style={{ position: 'absolute', left: c.x - S3 / 2, top: c.y - S3 / 2, opacity: mark3dOpacity }}>
          <Freeze frame={HERO_LOOP_FRAMES} active={f - T.handoff[0] >= HERO_LOOP_FRAMES}>
            <PhiHeroRings size={S3} startAt="mark" speed={HERO_SPEED} />
          </Freeze>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
