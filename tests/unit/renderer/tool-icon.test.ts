import { Blocks } from 'lucide-react';
import { toolIcon, type ToolPart } from '../../../src/renderer/src/components/prompt-kit/tool';

it.each(['list_apps', 'open_apps', 'close_apps'])(
	'uses the app icon for %s',
	(type) => {
		expect(toolIcon({ type, state: 'output-available' } satisfies ToolPart)).toBe(Blocks);
	}
);
