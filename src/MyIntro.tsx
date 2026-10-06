// 참가자 작업용 시작 파일. Claude Code 에게 "src/MyIntro.tsx 를 고쳐서…" 라고 지시하세요.
// 소스: kit/remotion/phi-logo.ts (2D 마크·워드마크), kit/remotion/PhiHeroRings.tsx (3D 링)
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { phiMark, phiWordmark } from '../kit/remotion/phi-logo';

const BG = '#F5F5F3';
const INK = '#141414';
const ease = Easing.bezier(0.35, 0, 0, 1);

export const MyIntro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 86 }}>
      {/* 링 두 개를 시간차로 그리기 */}
      <svg viewBox={phiMark.viewBox} width={360} height={360}>
        {phiMark.rings.map((r, i) => {
          const p = interpolate(frame, [i * 10, i * 10 + 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
          const { strokeDasharray, strokeDashoffset } = evolvePath(p, r.d);
          return (
            <path key={r.id} d={r.d} fill="none" stroke={INK} strokeWidth={r.strokeWidth}
              strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
          );
        })}
      </svg>
      {/* 글자를 한 자씩 올리기 */}
      <svg viewBox={phiWordmark.viewBox} width={phiWordmark.width * (360 / phiWordmark.height)} height={360} style={{ overflow: 'visible' }}>
        {phiWordmark.glyphs.map((g, i) => {
          const p = interpolate(frame, [40 + i * 2, 60 + i * 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
          return <path key={g.id} d={g.d} fill={INK} opacity={p} transform={`translate(0 ${(1 - p) * 4})`} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
