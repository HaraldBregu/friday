export async function isSetupComplete(): Promise<boolean> {
	const [provider, modelId] = await Promise.all([
		window.agent.getProvider(),
		window.agent.getModelId(),
	]);
	return Boolean(provider && modelId);
}
