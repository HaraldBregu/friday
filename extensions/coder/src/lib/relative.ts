export function relativeTime(value: string): string {
	const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
	const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
	if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
	const minutes = Math.round(seconds / 60);
	if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
	const hours = Math.round(minutes / 60);
	if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
	return formatter.format(Math.round(hours / 24), 'day');
}
