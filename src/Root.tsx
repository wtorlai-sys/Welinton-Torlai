import React from 'react';
import {Composition} from 'remotion';
import {VIDEO} from './style/constants';
import {TestScene, TEST_SCENE_FRAMES} from './scenes/TestScene';
import {PANELS, Storyboard} from './episodes/dormir/Storyboard';
import {CastSheet} from './scenes/CastSheet';
import {Teste10s, TESTE10_FRAMES} from './scenes/Teste10s';
import {DORMIR_FPS, DORMIR_FRAMES, DormirVideo} from './episodes/dormir/Video';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="TestScene" component={TestScene} durationInFrames={TEST_SCENE_FRAMES} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} defaultProps={{qc: false}} />
		{/* Mesma cena com as guias da área segura (QC) */}
		<Composition id="TestSceneQC" component={TestScene} durationInFrames={TEST_SCENE_FRAMES} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} defaultProps={{qc: true}} />
		{/* QC do personagem 2D: frame 0 = elenco, frame 1 = expressões */}
		<Composition id="CastSheet" component={CastSheet} durationInFrames={2} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
		{/* Episódio "Dormir no mesmo lugar": vídeo completo */}
		<Composition id="Dormir" component={DormirVideo} durationInFrames={DORMIR_FRAMES} fps={DORMIR_FPS} width={VIDEO.width} height={VIDEO.height} />
		{/* Episódio "Dormir no mesmo lugar": storyboard (1 frame = 1 quadro-chave) */}
		<Composition id="DormirStoryboard" component={Storyboard} durationInFrames={PANELS.length} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
		{/* Teste de 10 s do estilo 2D-em-3D (amostra para os próximos vídeos) */}
		<Composition id="Teste10s" component={Teste10s} durationInFrames={TESTE10_FRAMES} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} defaultProps={{qc: false}} />
		<Composition id="Teste10sQC" component={Teste10s} durationInFrames={TESTE10_FRAMES} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} defaultProps={{qc: true}} />
	</>
);
