# 메타프롬프트

[의도 카드](01-intent-card.md)를 붙여서 Claude Code에 그대로 넣습니다. 대괄호 부분을 채우세요.

```text
너는 모션 디자이너이자 Remotion 개발자다. 아래 [의도 카드]가 이 작업의 기준이다.
레퍼런스는 "원리"만 빌려오는 재료이고, 모든 결정은 의도를 더 잘 전달하는 쪽으로 내린다.
작업 파일은 src/MyIntro.tsx 이고, 길이는 src/Root.tsx 의 MyIntro durationInFrames 로 맞춘다.

[의도 카드]
(여기에 붙여넣기)

## 레퍼런스
- 파일: [Reference_Video_NN.mp4]
- 동작 분해 (시간 / 무엇이 / 어떻게): [...]
- 가져올 원리: [...]

## 소스 (kit/, 같은 소스 사용이 규칙)
- 2D: kit/remotion/phi-logo.ts
  - phiMark.rings(ring-a, ring-b): 타원 링, 두께 54.7, d는 긴 축 끝에서 시계방향
  - phiMark.d: 최종 프레임용 원본 마크
  - phiWordmark.glyphs: 23개, id로 지칭 (P, h, i1-dot, i1, I, n1 …), 3줄 구조
- 3D: kit/remotion/PhiHeroRings.tsx
  - <PhiHeroRings startAt="mark" speed={…} style="solid|line" />
  - 3D 크기 = 2D 마크 크기 × HERO_MARK_SCALE, 중심을 맞춘다
  - 교체 전에 2D 링을 HERO_MARK_POSE 로 보간하고 4~6프레임 크로스페이드
  - 한 바퀴 = 5.61초 ÷ speed, 끝나면 마크 자세 → 이후 <Freeze> 로 고정
- 새 도형은 점·선·원 같은 기본 도형만 허용

## 출력 규격
1920×1080, 30fps, [N]초. 배경 [#F5F5F3], 잉크 [#141414] (3D 재질과 사이트에 맞춘 색)

## 작업 순서
1. 의도를 네 말로 2문장으로 다시 말하고, 의도와 레퍼런스가 부딪히거나 모호한 곳이 있으면
   질문을 최대 3개 해라. 내 답을 받은 뒤 진행한다.
2. 막(Act) 단위 구성 → 프레임 단위 스토리보드 표를 만든다.
   열: 프레임 구간 / id / 속성 / 시작값→끝값 / 이징 / "이 비트가 의도에 기여하는 점"
   의도에 기여하지 않는 비트는 빼거나 이유를 적어라.
3. 내가 확인하면 구현한다. 막마다 나누고, 타이밍 상수는 파일 맨 위에 둔다.
   - 모양 바꾸기: 두 path를 N점 샘플링해 보간
   - 경로 이동: getPointAtLength
   - 선 그리기·궤도: evolvePath / strokeDasharray
4. 막이 바뀌는 프레임과 마지막 프레임의 스틸을 렌더해서(npx remotion still MyIntro --frame=N)
   ① 스토리보드와 다른 점 ② 의도가 화면에 드러나는지를 스스로 평가해라.
```
