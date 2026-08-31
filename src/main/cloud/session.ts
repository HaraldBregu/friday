export class MemorySessionStorage {
	private readonly memory = new Map<string, string>();

	async getItem(key: string): Promise<string | null> {
		return this.memory.get(key) ?? null;
	}

	async setItem(key: string, value: string): Promise<void> {
		this.memory.set(key, value);
	}

	async removeItem(key: string): Promise<void> {
		this.memory.delete(key);
	}

	clear(): void {
		this.memory.clear();
	}
}
