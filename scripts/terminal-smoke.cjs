const pty = require('node-pty');

async function main() {
	const marker = 'KUCEDR_PTY_OK';
	const windows = process.platform === 'win32';
	const shell = windows ? process.env.ComSpec || 'cmd.exe' : '/bin/sh';
	const processHandle = pty.spawn(shell, [], {
		name: 'xterm-256color',
		cols: 80,
		rows: 24,
		cwd: process.cwd(),
		env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
	});

	let output = '';
	const timeout = setTimeout(() => {
		processHandle.kill();
		console.error('Timed out waiting for PTY output.');
		process.exit(1);
	}, 10_000);

	processHandle.onData((data) => {
		output += data;
		if (!output.includes(marker)) return;
		clearTimeout(timeout);
		processHandle.kill();
		console.log(marker);
		process.exit(0);
	});
	processHandle.write(windows ? `echo ${marker}\r` : `printf '${marker}\\n'\r`);
}

void main();
