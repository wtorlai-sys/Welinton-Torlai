import {loadFont} from '@remotion/fonts';
import {continueRender, delayRender, staticFile} from 'remotion';

export const CAPTION_FONT = 'Montserrat Black';

let promise: Promise<void> | null = null;

/** Carrega a fonte heavy (legendas + placas) uma única vez. */
export const ensureFonts = (): Promise<void> => {
	if (!promise) {
		const handle = delayRender('Carregando Montserrat Black');
		promise = loadFont({
			family: CAPTION_FONT,
			url: staticFile('fonts/Montserrat-Black.woff2'),
			weight: '900',
		})
			.then(() => continueRender(handle))
			.catch((err) => {
				continueRender(handle);
				console.error(err);
			});
	}
	return promise;
};
