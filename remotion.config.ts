import {Config} from '@remotion/cli/config';

// Mesmo setup de render do projeto "o-custo-de-cada-clique".
Config.setChromiumOpenGlRenderer('swangle'); // troque para 'angle' numa máquina com GPU
Config.setBrowserExecutable('/opt/pw-browsers/chromium');
Config.setConcurrency(4);

// STYLE_GUIDE §1: H.264, CRF 16-18.
Config.setCodec('h264');
Config.setCrf(17);
Config.setPixelFormat('yuv420p');
Config.setVideoImageFormat('png');

// Frames com set inteiro + sombras em CPU (swangle) podem passar de 28 s.
Config.setDelayRenderTimeoutInMilliseconds(180000);
