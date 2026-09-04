import fs from 'node:fs/promises';
import path from 'node:path';

export async function createPluginFixture(root: string, version = '1.0.0'): Promise<string> {
	const plugin = path.join(root, 'package-one');
	await fs.mkdir(path.join(plugin, 'skills', 'hello'), { recursive: true });
	await fs.writeFile(path.join(plugin, 'skills', 'hello', 'SKILL.md'), '# Hello\n');
	await fs.writeFile(
		path.join(plugin, 'manifest.json'),
		JSON.stringify({
			schemaVersion: 4,
			id: 'package-one',
			name: 'Package One',
			version,
			description: 'A test plugin.',
			contributes: {
				skills: [{ id: 'hello', path: 'skills/hello' }],
			},
		})
	);
	await fs.writeFile(
		path.join(plugin, 'package.json'),
		JSON.stringify({
			name: '@kucedr-test/package-one',
			version,
			files: ['manifest.json', 'skills'],
		})
	);
	return plugin;
}
