const PRIVATE_KEY = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;
const ASSIGNED_SECRET =
	/(?:["']?(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|refresh[_-]?token|authorization)["']?)\s*[:=]\s*["']?(?:(?:Bearer|Basic)\s+)?[^\s"',}]{8,}/i;
const TOKEN =
	/\b(?:sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/;

export function containsSecret(content: string): boolean {
	return PRIVATE_KEY.test(content) || ASSIGNED_SECRET.test(content) || TOKEN.test(content);
}
