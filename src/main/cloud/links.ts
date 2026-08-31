export class AuthLinkBroker {
	private readonly queue: string[] = [];
	private listener?: (url: string) => Promise<void>;

	push(url: string): boolean {
		if (!this.accepts(url)) return false;
		if (this.listener) void this.listener(url);
		else this.queue.push(url);
		return true;
	}

	pushArguments(argumentsList: readonly string[]): boolean {
		const url = argumentsList.find((value) => this.accepts(value));
		return url ? this.push(url) : false;
	}

	subscribe(listener: (url: string) => Promise<void>): () => void {
		this.listener = listener;
		return () => {
			if (this.listener === listener) this.listener = undefined;
		};
	}

	async flush(): Promise<boolean> {
		if (!this.listener || this.queue.length === 0) return false;
		const pending = this.queue.splice(0);
		for (const url of pending) await this.listener(url);
		return true;
	}

	private accepts(value: string): boolean {
		if (value.length > 4096) return false;
		try {
			const url = new URL(value);
			return url.protocol === 'friday:' && url.hostname === 'auth' && url.pathname === '/callback';
		} catch {
			return false;
		}
	}
}

export const authLinks = new AuthLinkBroker();
