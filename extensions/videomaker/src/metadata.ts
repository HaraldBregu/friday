import { ALL_FORMATS, BlobSource, Input } from 'mediabunny';

export async function readMediaDuration(file: File): Promise<number> {
	if (file.type.startsWith('image/')) return 5;
	const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
	try {
		if (!(await input.canRead())) throw new Error(`${file.name} is not a supported media file.`);
		const video = await input.getPrimaryVideoTrack();
		const audio = await input.getPrimaryAudioTrack();
		const primary = file.type.startsWith('audio/') ? audio : video;
		if (!primary) throw new Error(`${file.name} does not contain a usable media track.`);
		const tracks = [video, audio].filter((track) => track !== null);
		const decodable = await Promise.all(tracks.map((track) => track.canDecode()));
		if (decodable.some((supported) => !supported)) {
			throw new Error(`${file.name} uses a codec that browser rendering cannot decode.`);
		}
		const duration = await input.getDurationFromMetadata(tracks);
		return Number.isFinite(duration) ? Math.max(0.5, duration ?? 5) : 5;
	} finally {
		input.dispose();
	}
}
