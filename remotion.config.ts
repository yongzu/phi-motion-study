import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// 3D 링(three.js)이 WebGL을 쓰므로 GPU 백엔드를 지정
Config.setChromiumOpenGlRenderer('angle');
