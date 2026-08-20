export type * from '../shared/api_types';

import type {
	AgentApi,
	CoderApi,
	A2aApi,
	AppApi,
	RecorderApi,
	TaskApi,
	McpApi,
	ModelsApi,
	ProviderApi,
	SearchApi,
	SkillsApi,
	StorageApi,
	DatabaseApi,
	ExtensionsApi,
	WikiApi,
	WindowApi,
	DataApi,
} from '../shared/api_types';

declare global {
	interface Window {
		win: WindowApi;
		app: AppApi;
		agent: AgentApi;
		coder: CoderApi;
		a2a: A2aApi;
		recorder: RecorderApi;
		tasks: TaskApi;
		skills: SkillsApi;
		mcp: McpApi;
		models: ModelsApi;
		storage: StorageApi;
		database: DatabaseApi;
		provider: ProviderApi;
		search: SearchApi;
		extensions: ExtensionsApi;
		wiki: WikiApi;
		dataControls: DataApi;
	}
}
