import { render } from 'ink';
import { KucedrTui, type TuiProps } from './app.js';

export async function renderTui(props: TuiProps): Promise<void> {
	const instance = render(<KucedrTui {...props} />);
	await instance.waitUntilExit();
}
