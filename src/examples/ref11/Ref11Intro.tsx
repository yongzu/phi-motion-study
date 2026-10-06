// 예시: Reference_Video_11 (상태바 → 로딩 심볼 Copy Study) + 3D 전환 + 워드마크
//
// 의도: 점 하나(가장 작은 기본 요소)가 선이 되고, 선이 궤도를 그리며 하나의 생각(마크)이 되고,
//       그 생각이 입체로 깨어나며 이름(워드마크)을 얻는다. — Fundamentals Over Tools
//
// 1막 (2D, 11번의 원리)  점 → 길어져 선 → 두 링이 만나는 자리에서 선이 X 로 갈라져
//                        위쪽은 ring-a, 아래쪽은 ring-b 궤도를 돌며 길어짐 → 떨어져 나온 점 3개가 ring-a 빈틈에 안착
// 다리                   2D 링을 3D 링의 멈춘 자세(HERO_MARK_POSE)로 보간 → 3D로 교체
// 2막 (3D)               마크 자세에서 깨어나 회전, 왼쪽으로 비켜서며 오른쪽에서 점마다 워드마크가 자람
import { AbsoluteFill, Easing, Freeze, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { getBoundingBox, getLength, getPointAtLength } from '@remotion/paths';
import { phiMark, phiWordmark } from '../../../kit/remotion/phi-logo';
import { HERO_MARK_POSE, HERO_MARK_SCALE, PhiHeroRings } from '../../../kit/remotion/PhiHeroRings';
import { HERO_TIMING } from '../../../kit/remotion/phi-hero-rings';

// ---------- 타이밍 (프레임, 30fps) ----------
export const REF11_DURATION = 240;
const T = {
  pop: 0, // 점이 나타남
  stretch: [16, 30], // 점 → 선 (중앙에서 갈라질 자리로 이동하며 길어짐)
  pinch: 24, // 선 끝에서 점 3개가 떨어져 나옴 (점마다 +2)
  bend: [38, 50], // 선이 X 로 갈라지며 원호로 휨
  orbit: [40, 78], // 두 원호가 반대 방향으로 궤도를 돌며 길어짐
  dotsStart: 56, // 점이 빈틈으로 출발
  dotStagger: 3,
  dotDur: 24,
  close: [86, 94], // ring-a 빈틈이 닫히며 점이 선에 녹아듦
  toPose: [94, 106], // 2D 링 → 3D 링이 멈춘 자세 (모양·두께)
  handoff: [106, 110], // 2D → 3D 크로스페이드
  move3d: [134, 164], // 3D 마크가 왼쪽 로크업 자리로
  wordDots: 142, // 워드마크 자리에 점이 나타남 (줄마다 +3)
  word: 148, // 점에서 글자가 자람 (줄마다 +4)
  wordLineStagger: 4,
  wordDur: 16,
} as const;

const EASE_FUNDAMENTAL = Easing.bezier(0.83, 0, 0.17, 1); // 11번의 강한 가속·감속
const EASE_EXPAND = Easing.bezier(0.35, 0, 0, 1); // Phi 인트로 이징

// ---------- 레이아웃 ----------
const BG = '#F5F5F3';
const INK = '#141414';
const M = 360; // 2D 마크 크기(px) — viewBox 800
const K = M / 800; // 마크 단위 → px
const RING_W = phiMark.rings[0].strokeWidth; // 54.7 (마크 단위)
const LINE_W = RING_W * K; // 화면에서의 선 두께 (= 처음 점의 지름)
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
const markToScreen = (p: Pt, c: Pt = MARK_CENTER): Pt => ({ x: c.x + (p.x - 400) * K, y: c.y + (p.y - 400) * K });
const wmToScreen = (p: Pt): Pt => ({ x: WM.x + p.x * WM_K, y: WM.y + p.y * WM_K });
const mod = (v: number, m: number) => ((v % m) + m) % m;

// ---------- 링을 길이로 찾는 표 (마크 단위) ----------
const RING_A = phiMark.rings.find((r) => r.id === 'ring-a')!;
const RING_B = phiMark.rings.find((r) => r.id === 'ring-b')!;
function ringTrack(d: string) {
  const L = getLength(d);
  const n = 2048;
  const lut: Pt[] = Array.from({ length: n + 1 }, (_, i) => getPointAtLength(d, (L * i) / n)!);
  const at = (s: number): Pt => {
    const u = (mod(s, L) / L) * n;
    const i = Math.floor(u);
    return lerpPt(lut[i], lut[Math.min(i + 1, n)], u - i);
  };
  return { L, lut, at, n };
}
const A = ringTrack(RING_A.d);
const B = ringTrack(RING_B.d);

// 두 링이 만나는 4곳 중 가장 오른쪽 = 선이 X 로 갈라지는 자리
const CROSS = (() => {
  let best = { sa: 0, sb: 0, d: Infinity, x: -Infinity };
  const step = 4;
  for (let i = 0; i < A.n; i += step) {
    const pa = A.lut[i];
    for (let j = 0; j < B.n; j += step) {
      const pb = B.lut[j];
      const d = Math.hypot(pa.x - pb.x, pa.y - pb.y);
      // 오른쪽에 있을수록, 같은 자리면 더 가까울수록 우선
      if (d < 4 && (pa.x > best.x + 10 || (Math.abs(pa.x - best.x) <= 10 && d < best.d))) {
        best = { sa: (A.L * i) / A.n, sb: (B.L * j) / B.n, d, x: pa.x };
      }
    }
  }
  return best;
})();
const E = markToScreen(A.at(CROSS.sa));
// 각 링에서 "위로 가는" 방향(+1: s 증가, -1: s 감소)
const upDir = (t: ReturnType<typeof ringTrack>, s: number) => (t.at(s + 1).y < t.at(s).y ? 1 : -1);
const DIR_A = upDir(A, CROSS.sa); // 위쪽 절반 → ring-a
const DIR_B = -upDir(B, CROSS.sb); // 아래쪽 절반 → ring-b

const STICK_LEN = 150; // 선의 길이 (px)
const HALF0 = STICK_LEN / 2 / K; // 반쪽 선과 같은 길이의 원호 (마크 단위)

// ring-a 의 빈틈: 왼쪽 아래 끝(SW 끝, d 가 NE 끝에서 시작하므로 s = L/2). 점들이 마크 아래로 휘어 들어온다
const GAP_S = 0.5 * A.L;
const GAP_LEN = 0.15 * A.L;
const TAIL_A_FINAL = DIR_A > 0 ? GAP_S + GAP_LEN / 2 : GAP_S - GAP_LEN / 2;
const TAIL_A_TRAVEL = mod((TAIL_A_FINAL - CROSS.sa) * DIR_A, A.L);

// ---------- 점 3개: 선 끝에서 떨어져 나와 매달려 있다가 빈틈으로 ----------
const R_DOT = 1.1 * WM_K;
const HANG = [0, 1, 2].map((k) => ({ x: E.x + 6 * k, y: E.y + STICK_LEN / 2 + 34 + k * 28 }));
const dots = HANG.map((from, k) => ({ k, from }))
  .sort((p, q) => q.k - p.k) // 아래쪽(빈틈에 가까운) 점부터 출발
  .map((d, order) => ({ ...d, order, to: markToScreen(A.at(GAP_S + (1 - order) * DIR_A * (GAP_LEN / 4))) }));

// ---------- 워드마크 ----------
const glyphs = phiWordmark.glyphs.map((g) => {
  const b = getBoundingBox(g.d);
  return { ...g, c: { x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 } };
});
const LINES = ['line-1', 'line-2', 'line-3'] as const;
const LINE_DOT: Record<string, string> = { 'line-1': 'i1-dot', 'line-2': 'i2-dot', 'line-3': 'i3-dot' };
const dotOf = (line: string) => glyphs.find((g) => g.id === LINE_DOT[line])!;

const markCenterAt = (f: number): Pt => lerpPt(MARK_CENTER, MARK_HOME, iv(f, T.move3d, [0, 1], EASE_EXPAND));

const N = 121;
const toPath = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('');

// 1막: 선이 X 로 갈라져 두 링의 궤도를 돈다 (위쪽 절반 → ring-a, 아래쪽 절반 → ring-b)
function splitStrokes(f: number) {
  const m = iv(f, T.bend, [0, 1], EASE_FUNDAMENTAL);
  const o = iv(f, T.orbit, [0, 1], EASE_FUNDAMENTAL);
  const cl = iv(f, T.close, [0, 1], EASE_FUNDAMENTAL);
  // ring-a: 꼬리도 함께 이동하며 SW 끝에 빈틈을 남기고, 마지막에 빈틈이 닫힌다
  const tailA = CROSS.sa + DIR_A * (TAIL_A_TRAVEL * o - (GAP_LEN / 2) * cl);
  const lenA = lerp(HALF0, A.L - GAP_LEN, o) + GAP_LEN * cl;
  // ring-b: 꼬리는 갈라지는 자리에 고정, 머리가 한 바퀴 돌아 닫힌다
  const lenB = lerp(HALF0, B.L, o);
  const top: Pt[] = [];
  const bottom: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const stickUp = { x: E.x, y: E.y - (STICK_LEN / 2) * t };
    const stickDown = { x: E.x, y: E.y + (STICK_LEN / 2) * t };
    top.push(lerpPt(stickUp, markToScreen(A.at(tailA + DIR_A * lenA * t)), m));
    bottom.push(lerpPt(stickDown, markToScreen(B.at(CROSS.sb + DIR_B * lenB * t)), m));
  }
  return [toPath(top), toPath(bottom)];
}

const quad = (p0: Pt, p1: Pt, p2: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
  y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y,
});

export const Ref11Intro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = markCenterAt(f);
  const mark2dOpacity = iv(f, T.handoff, [1, 0]);
  const mark3dOpacity = iv(f, T.handoff, [0, 1]);

  // 점 → 선: 화면 중앙에서 나타나 갈라질 자리로 이동하며 길어진다
  const pop = spring({ frame: f - T.pop, fps, config: { damping: 12, mass: 0.5 } });
  const stretch = iv(f, T.stretch, [0, 1], EASE_FUNDAMENTAL);
  const stickC = lerpPt(MARK_CENTER, E, stretch);
  const stickLen = STICK_LEN * stretch;

  // 2D 링 → 3D 링이 멈춘 자세
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

  return (
    <AbsoluteFill style={{ background: BG }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
        {/* 1막 ① 점 → 선 */}
        {f < T.bend[0] && (
          <line
            x1={stickC.x} y1={stickC.y - stickLen / 2} x2={stickC.x} y2={stickC.y + stickLen / 2}
            stroke={INK} strokeWidth={LINE_W * Math.max(pop, 0)} strokeLinecap="round"
          />
        )}

        {/* 1막 ② 선이 X 로 갈라져 궤도를 돈다 */}
        {f >= T.bend[0] && f < T.close[1] &&
          splitStrokes(f).map((d, i) => (
            <path key={i} d={d} fill="none" stroke={INK} strokeWidth={LINE_W} strokeLinecap="round" strokeLinejoin="round" />
          ))}

        {/* 1막 ③ 점 3개: 선 끝에서 떨어져 매달림 → 곡선을 타고 빈틈에 안착 → 선에 녹아듦 */}
        {f < T.close[1] &&
          dots.map((d) => {
            const drop = spring({ frame: f - (T.pinch + d.k * 2), fps, config: { damping: 14, mass: 0.5 } });
            const bottomEnd = { x: E.x, y: E.y + STICK_LEN / 2 };
            const hang = lerpPt(bottomEnd, d.from, drop);
            const go = spring({ frame: f - (T.dotsStart + d.order * T.dotStagger), fps, durationInFrames: T.dotDur, config: { damping: 11, mass: 0.6 } });
            const ctrl = { x: (d.from.x + d.to.x) / 2 + 40, y: Math.max(d.from.y, d.to.y) + 170 };
            const pos = f < T.dotsStart ? hang : quad(d.from, ctrl, d.to, go);
            const r = f < T.close[0] ? R_DOT * Math.min(drop, 1) : iv(f, T.close, [R_DOT, LINE_W / 2]);
            const op = iv(f, [T.close[1] - 3, T.close[1]], [1, 0]);
            return drop > 0.01 && op > 0 ? <circle key={d.k} cx={pos.x} cy={pos.y} r={r} fill={INK} opacity={op} /> : null;
          })}

        {/* 2D 마크 (빈틈이 닫힌 뒤) → 3D 자세로 보간 */}
        {f >= T.close[1] && mark2dOpacity > 0 && (
          <g opacity={mark2dOpacity} transform={`translate(${c.x - 400 * K} ${c.y - 400 * K}) scale(${K})`} fill="none" stroke={INK}>
            {[RING_A, RING_B].map((r) => {
              const e = ring2d(r);
              return <ellipse key={r.id} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} strokeWidth={e.w} transform={`rotate(${e.rotate} ${e.cx} ${e.cy})`} />;
            })}
          </g>
        )}

        {/* 2막 워드마크: 줄마다 점이 먼저 나타나고, 그 점에서 글자가 자란다 */}
        {f >= T.wordDots && (
          <g transform={`translate(${WM.x} ${WM.y}) scale(${WM_K})`} fill={INK}>
            {glyphs.map((g) => {
              if (g.part === 'dot') return null;
              const line = LINES.indexOf(g.line);
              const s0 = T.word + line * T.wordLineStagger;
              const p = iv(f, [s0, s0 + T.wordDur], [1, 0], EASE_EXPAND); // 1 = 점으로 접힘, 0 = 제자리
              if (p >= 0.999) return null;
              const dot = dotOf(g.line).c;
              const tx = (dot.x - g.c.x) * p;
              const ty = (dot.y - g.c.y) * p;
              const s = 1 - 0.92 * p;
              return (
                <path key={g.id} d={g.d} opacity={interpolate(p, [0.7, 1], [1, 0], clamp)}
                  transform={`translate(${g.c.x + tx} ${g.c.y + ty}) scale(${s}) translate(${-g.c.x} ${-g.c.y})`} />
              );
            })}
            {LINES.map((line, li) => {
              const g = dotOf(line);
              const appear = spring({ frame: f - (T.wordDots + li * 3), fps, config: { damping: 12, mass: 0.5 } });
              const back = T.word + li * T.wordLineStagger + T.wordDur - 6;
              const toGlyph = iv(f, [back, back + 6], [0, 1]);
              return (
                <g key={line}>
                  <circle cx={g.c.x} cy={g.c.y} r={(R_DOT / WM_K) * appear} opacity={1 - toGlyph} />
                  <path d={g.d} opacity={toGlyph} />
                </g>
              );
            })}
          </g>
        )}
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
