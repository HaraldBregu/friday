import type { ImageResult } from '@kucedr/sdk';
import type { CropSettings } from './types';

export function cropImage(source: string, settings: CropSettings): Promise<ImageResult> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onerror = () => reject(new Error('The image could not be cropped.'));
		image.onload = () => {
			const originalRatio = image.naturalWidth / image.naturalHeight;
			const [ratioWidth, ratioHeight] =
				settings.ratio === 'original'
					? [originalRatio, 1]
					: settings.ratio.split(':').map(Number);
			const targetRatio = ratioWidth / ratioHeight;
			let width = image.naturalWidth;
			let height = image.naturalHeight;
			if (originalRatio > targetRatio) width = height * targetRatio;
			else height = width / targetRatio;
			width /= settings.zoom;
			height /= settings.zoom;
			const sourceX = ((settings.x + 100) / 200) * (image.naturalWidth - width);
			const sourceY = ((settings.y + 100) / 200) * (image.naturalHeight - height);
			const scale = Math.min(1, 2048 / width, 2048 / height);
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, Math.round(width * scale));
			canvas.height = Math.max(1, Math.round(height * scale));
			const context = canvas.getContext('2d');
			if (!context) return reject(new Error('Image cropping is unavailable.'));
			context.drawImage(
				image,
				sourceX,
				sourceY,
				width,
				height,
				0,
				0,
				canvas.width,
				canvas.height
			);
			resolve({ base64: canvas.toDataURL('image/png').split(',')[1], mimeType: 'image/png' });
		};
		image.src = source;
	});
}
