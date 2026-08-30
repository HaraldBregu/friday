import { safeStorage } from 'electron';
import { openA2aAgent } from '../../../../src/main/agent/a2a/open';
import { preserveA2aCredential } from '../../../../src/main/agent/a2a/preserve';
import { sealA2aAgent } from '../../../../src/main/agent/a2a/seal';

const encryptionAvailable = safeStorage.isEncryptionAvailable as jest.Mock;
const selectedBackend = safeStorage.getSelectedStorageBackend as jest.Mock;
const encrypt = safeStorage.encryptString as jest.Mock;
const decrypt = safeStorage.decryptString as jest.Mock;

beforeEach(() => {
	encryptionAvailable.mockReturnValue(true);
	selectedBackend.mockReturnValue('gnome_libsecret');
	encrypt.mockImplementation((value: string) => Buffer.from(value, 'utf8'));
	decrypt.mockImplementation((value: Buffer) => value.toString('utf8'));
});

it('encrypts credentials outside the persisted A2A record', () => {
	const sealed = sealA2aAgent({
		id: 'agent',
		name: 'Agent',
		url: 'https://agent.example',
		authType: 'api-key',
		credential: 'sentinel-secret',
		apiKeyHeader: 'X-API-Key',
		enabled: true,
		skills: [],
	});
	expect(JSON.stringify(sealed.record)).not.toContain('sentinel-secret');
	expect(sealed.record.encryptedCredential).toBeDefined();
	expect(openA2aAgent(sealed.record).agent.credential).toBe('sentinel-secret');
});

it('refuses to decrypt a credential after its endpoint metadata is changed', () => {
	const sealed = sealA2aAgent({
		id: 'agent',
		name: 'Agent',
		url: 'https://agent.example',
		authType: 'bearer',
		credential: 'sentinel-secret',
		enabled: true,
		skills: [],
	});
	const opened = openA2aAgent({ ...sealed.record, url: 'https://other.example' });
	expect(opened.agent).not.toHaveProperty('credential');
	expect(opened.encryptedCredentialUnreadable).toBe(true);
});

it('keeps credentials memory-only when OS encryption is unavailable', () => {
	encryptionAvailable.mockReturnValue(false);
	const sealed = sealA2aAgent({
		id: 'agent',
		name: 'Agent',
		url: 'https://agent.example',
		authType: 'bearer',
		credential: 'sentinel-secret',
		enabled: true,
		skills: [],
	});
	expect(sealed.record).not.toHaveProperty('credential');
	expect(sealed.record).not.toHaveProperty('encryptedCredential');
	expect(sealed.volatileCredential).toBe('sentinel-secret');
});

it('keeps credentials memory-only with Electron basic text encryption on Linux', () => {
	jest.replaceProperty(process, 'platform', 'linux');
	selectedBackend.mockReturnValue('basic_text');
	const sealed = sealA2aAgent({
		id: 'agent',
		name: 'Agent',
		url: 'https://agent.example',
		authType: 'bearer',
		credential: 'sentinel-secret',
		enabled: true,
		skills: [],
	});
	expect(sealed.record).not.toHaveProperty('encryptedCredential');
	expect(sealed.volatileCredential).toBe('sentinel-secret');
});

it('opens legacy plaintext bearer tokens for encrypted migration', () => {
	const opened = openA2aAgent({
		id: 'legacy',
		name: 'Legacy',
		url: 'https://agent.example',
		token: 'legacy-secret',
		enabled: true,
		skills: [],
	} as never);
	expect(opened.hasPlaintextCredential).toBe(true);
	expect(opened.agent).toMatchObject({ authType: 'bearer', credential: 'legacy-secret' });
});

it('preserves only legacy secret fields while OS encryption is unavailable', () => {
	expect(
		preserveA2aCredential(
			{
				id: 'legacy',
				name: 'Updated',
				url: 'https://agent.example',
				authType: 'bearer',
				credential: 'legacy-secret',
				enabled: false,
				skills: ['Updated skill'],
			},
			{
				id: 'legacy',
				name: 'Legacy',
				url: 'https://agent.example',
				token: 'legacy-secret',
				enabled: true,
				skills: [],
			} as never
		)
	).toEqual({
		id: 'legacy',
		name: 'Updated',
		url: 'https://agent.example',
		authType: 'bearer',
		token: 'legacy-secret',
		enabled: false,
		skills: ['Updated skill'],
	});
});
