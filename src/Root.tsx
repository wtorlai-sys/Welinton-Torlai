import React from 'react';
import {Composition} from 'remotion';
import {VIDEO} from './style/constants';
import {TestScene, TEST_SCENE_FRAMES} from './scenes/TestScene';
import {PANELS, Storyboard} from './episodes/dormir/Storyboard';
import {CastSheet} from './scenes/CastSheet';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="TestScene" component={TestScene} durationInFrames={TEST_SCENE_FRAMES} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} defaultProps={{qc: false}} />
		{/* Mesma cena com as guias da área segura (QC) */}
		<Composition id="TestSceneQC" component={TestScene} durationInFrames={TEST_SCENE_FRAMES} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} defaultProps={{qc: true}} />
		{/* QC do personagem 2D: frame 0 = elenco, frame 1 = expressões */}
		<Composition id="CastSheet" component={CastSheet} durationInFrames={2} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
		{/* Episódio "Dormir no mesmo lugar": storyboard (1 frame = 1 quadro-chave) */}
		<Composition id="DormirStoryboard" component={Storyboard} durationInFrames={PANELS.length} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
	</>
);
