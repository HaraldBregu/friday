import type { RagConfiguration } from '../../../../src/shared/rag_types';
const getProvider = jest.fn();
jest.mock('../../../../src/main/settings_store', () => ({ getProvider }));
import { authorizeRagDisclosure } from '../../../../src/main/agent/knowledge/rag/disclosure';
import { assertRagConsent } from '../../../../src/main/agent/knowledge/rag/consent';

let configuration: RagConfiguration;
beforeEach(() => {
 getProvider.mockReturnValue({ apiKey: 'synthetic-embedding-account' });
 process.env.PINECONE_API_KEY = 'synthetic-mirror-account';
 configuration = { enabled: true, indexName: 'knowledge-base', databaseId: '', databaseProviderId: '', embeddingProviderId: 'openai', embeddingModelId: 'model', embeddingConsent: null, mirrorConsent: null, folders: [], scheduleEnabled: false, cronExpression: '0 3 * * *' };
});
afterEach(() => { delete process.env.PINECONE_API_KEY; });

it('leaves missing and legacy consent unapproved during ordinary saves', () => {
 expect(authorizeRagDisclosure(configuration).embeddingConsent).toBeNull();
 configuration.embeddingConsent = { providerId: 'openai', modelId: 'model' };
 const saved = authorizeRagDisclosure(configuration);
 expect(saved.embeddingConsent).toEqual(configuration.embeddingConsent);
 expect(() => assertRagConsent(saved, 'openai', 'model', 'knowledge-base')).toThrow('Confirm');
});

it('retains valid recipient consent without requiring another owner decision', () => {
 configuration.embeddingConsent = { version: 1, providerId: 'openai', modelId: 'model' };
 configuration.mirrorConsent = { version: 1, indexName: 'knowledge-base' };
 const saved = authorizeRagDisclosure(configuration);
 expect(authorizeRagDisclosure({ ...saved, scheduleEnabled: true })).toMatchObject({ embeddingConsent: saved.embeddingConsent, mirrorConsent: saved.mirrorConsent });
 expect(() => assertRagConsent(saved, 'openai', 'model', 'knowledge-base', true)).not.toThrow();
 expect(JSON.stringify(saved)).not.toContain('synthetic-');
});

it.each(['embedding', 'mirror'])('does not remint existing consent after the %s account changes', (kind) => {
 configuration.embeddingConsent = { version: 1, providerId: 'openai', modelId: 'model' };
 configuration.mirrorConsent = { version: 1, indexName: 'knowledge-base' };
 const saved = authorizeRagDisclosure(configuration);
 if (kind === 'embedding') getProvider.mockReturnValue({ apiKey: 'changed-account' });
 else process.env.PINECONE_API_KEY = 'changed-account';
 const changed = authorizeRagDisclosure(saved);
 expect(changed).toEqual(saved);
 expect(() => assertRagConsent(changed, 'openai', 'model', 'knowledge-base', true)).toThrow('Confirm');
});
