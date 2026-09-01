const mockPinecone = jest.fn(() => ({ index: jest.fn() }));

jest.mock('@pinecone-database/pinecone', () => ({ Pinecone: mockPinecone }));

import { ragClient } from '../../../../src/main/agent/knowledge/rag/rag_client';

afterEach(() => {
	delete process.env.PINECONE_API_KEY;
	mockPinecone.mockClear();
});

it('creates the Pinecone client from the environment key', () => {
	process.env.PINECONE_API_KEY = ' environment-key ';

	const client = ragClient();

	expect(mockPinecone).toHaveBeenCalledWith({ apiKey: 'environment-key' });
	expect(client).toEqual(expect.objectContaining({ index: expect.any(Function) }));
});

it('fails when the Pinecone environment key is missing', () => {
	expect(() => ragClient()).toThrow('PINECONE_API_KEY is not configured.');
	expect(mockPinecone).not.toHaveBeenCalled();
});
