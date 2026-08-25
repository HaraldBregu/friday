import { IMAGE_SOURCE_MAX_BYTES, type ImageSource } from '@friday/sdk';

export function readImage(file: File): Promise<ImageSource> {
	if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
		return Promise.reject(new Error('Choose a JPEG, PNG, or WebP image.'));
	}
	if (file.size > IMAGE_SOURCE_MAX_BYTES) {
		return Promise.reject(new Error('Choose an image smaller than 18 MB.'));
	}
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error('The image could not be read.'));
		reader.onload = () => {
			const result = String(reader.result);
			const base64 = result.slice(result.indexOf(',') + 1);
			resolve({ base64, mimeType: file.type as ImageSource['mimeType'] });
		};
		reader.readAsDataURL(file);
	});
}
