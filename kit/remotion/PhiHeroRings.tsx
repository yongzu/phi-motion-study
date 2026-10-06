import { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { createPhiHero, HERO_TIMING, type PhiHero, type PhiHeroStyle } from './phi-hero-rings';

type Props = {
  size?: number;
  style?: PhiHeroStyle;
  /**
   * 진행도(0~1)를 직접 넘기면 사이트 타이밍 대신 이 값으로 그린다.
   * 예) progress={interpolate(frame, [0, 90], [0, 1], { easing: Easing.bezier(0.35, 0, 0, 1) })}
   */
  progress?: number;
  /** progress 를 안 넘겼을 때: 사이트와 같은 타이밍 × speed */
  speed?: number;
  /**
   * progress 를 안 넘겼을 때: 사이트 타이밍의 어느 시점(ms)부터 시작할지.
   * 'mark' = 2D 마크와 같은 자세(정지 상태)에서 출발해 가속하며 돌기 시작 → 2D → 3D 이어 붙일 때 사용
   */
  startAt?: number | 'mark';
};

export const PhiHeroRings: React.FC<Props> = ({ size = 800, style = 'solid', progress, speed = 1, startAt = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const hero = useRef<PhiHero | null>(null);

  useLayoutEffect(() => {
    hero.current = createPhiHero({ canvas: canvas.current!, size, style, pixelRatio: 1 });
    return () => {
      hero.current?.dispose();
      hero.current = null;
    };
  }, [size, style]);

  useLayoutEffect(() => {
    if (!hero.current) return;
    // 한 바퀴(loopMs)가 끝나는 순간 = 마크 자세. 다음 바퀴는 그 자세에서 정지 상태로 출발한다
    const offset = startAt === 'mark' ? HERO_TIMING.loopMs : startAt;
    if (progress === undefined) hero.current.renderAt(offset + (frame / fps) * 1000 * speed);
    else hero.current.renderProgress(progress);
  }, [frame, fps, progress, speed, startAt, size, style]);

  return <canvas ref={canvas} style={{ width: size, height: size }} />;
};

/** 3D 캔버스 크기 = 2D 마크 크기 × 이 값일 때, 3D 링이 2D 마크와 같은 크기로 보인다 */
export const HERO_MARK_SCALE = 1.49;

/**
 * 3D 링이 멈춘 자세(startAt="mark")를 2D 마크 좌표(viewBox 800)로 옮긴 타원.
 * 2D ring-a/ring-b 와 거의 같지만 ring-a 는 3D 쪽이 더 가늘다(rx 171 → 123).
 * 2D → 3D 로 넘어가기 직전에 2D 링을 이 값으로 보간하면 이음매 없이 교체된다.
 * strokeWidth 는 눈에 보이는 두께 (3D 가장자리 음영 때문에 실제 튜브보다 얇게 보임).
 */
export const HERO_MARK_POSE = {
  'ring-a': { cx: 400.88, cy: 402.54, rx: 123.33, ry: 492.24, rotate: 44.63, strokeWidth: 48 },
  'ring-b': { cx: 400, cy: 396.93, rx: 236.27, ry: 459.57, rotate: -44.98, strokeWidth: 48 },
} as const;
