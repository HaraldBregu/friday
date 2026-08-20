import path from 'node:path';
import { userDataLocation } from '../shared/user_data_location';

export function coderLocation(): string {
	return path.join(userDataLocation(), 'coder', 'pi');
}

export function coderSessionsLocation(): string {
	return path.join(coderLocation(), 'sessions');
}
