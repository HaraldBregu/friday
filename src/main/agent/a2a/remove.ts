import { getA2aAgents, setA2aAgents } from './store';

export function removeA2aAgent(id: string): void {
	setA2aAgents(getA2aAgents().filter((agent) => agent.id !== id));
}
