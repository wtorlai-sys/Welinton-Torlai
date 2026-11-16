import React from 'react';
import {Composition} from 'remotion';
import {VIDEO} from './style/constants';
import {TestScene, TEST_SCENE_FRAMES} from './scenes/TestScene';
import {PANELS, Storyboard} from './episodes/dormir/Storyboard';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="TestScene" component={TestScene} durationInFrames={TEST_SCENE_FRAMES} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} defaultProps={{qc: false}} />
		{/* Mesma cena com as guias da área segura (QC) */}
		<Composition id="TestSceneQC" component={TestScene} durationInFrames={TEST_SCENE_FRAMES} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} defaultProps={{qc: true}} />
		{/* Episódio "Dormir no mesmo lugar": storyboard (1 frame = 1 quadro-chave) */}
		<Composition id="DormirStoryboard" component={Storyboard} durationInFrames={PANELS.length} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
	</>
);
