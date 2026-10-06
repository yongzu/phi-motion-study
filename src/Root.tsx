import { Composition, Folder } from 'remotion';
import { MyIntro } from './MyIntro';
import { REF11_DURATION, Ref11Intro } from './examples/ref11/Ref11Intro';

const video = { width: 1920, height: 1080, fps: 30 } as const;

export const Root: React.FC = () => (
  <>
    {/* 참가자 작업용: 이 파일에서 시작하세요 */}
    <Composition id="MyIntro" component={MyIntro} durationInFrames={150} {...video} />
    <Folder name="Examples">
      <Composition id="Ref11Intro" component={Ref11Intro} durationInFrames={REF11_DURATION} {...video} />
    </Folder>
  </>
);
