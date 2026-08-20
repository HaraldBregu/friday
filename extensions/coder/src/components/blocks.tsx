import { useState } from 'react';
import { Check, ChevronDown, Clipboard, LoaderCircle, RotateCcw, Terminal, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { app } from '@friday/sdk';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CoderBlock, CoderController } from '@/controller';

function MessageBlock({ block }: { block: Extract<CoderBlock, { type: 'message' }> }) {
	return (
		<article className="group border-b px-4 py-4 sm:px-6" aria-label={`${block.role} message`}>
			<div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
				<span>{block.role === 'user' ? 'You' : 'Pi'}</span>
				{block.status === 'streaming' ? <LoaderCircle className="size-3 animate-spin" /> : null}
				{block.content ? (
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant="ghost"
									size="icon-sm"
									className="ml-auto size-6 opacity-70 hover:opacity-100"
									aria-label={`Copy ${block.role} message`}
									onClick={() => void navigator.clipboard.writeText(block.content)}
								>
									<Clipboard />
								</Button>
							}
						/>
						<TooltipContent>Copy message</TooltipContent>
					</Tooltip>
				) : null}
			</div>
			{block.role === 'assistant' ? (
				<div className="coder-markdown max-w-none text-sm leading-6">
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						components={{
							a: ({ href, children }) => (
								<Button
									variant="link"
									className="h-auto p-0 text-link"
									onClick={() => href && void app.openExternalUrl(href)}
								>
									{children}
								</Button>
							),
						}}
					>
						{block.content}
					</ReactMarkdown>
				</div>
			) : (
				<p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{block.content}</p>
			)}
		</article>
	);
}

function ToolBlock({ block }: { block: Extract<CoderBlock, { type: 'tool' }> }) {
	const icon =
		block.status === 'running' ? (
			<LoaderCircle className="size-3.5 animate-spin text-command" />
		) : block.status === 'succeeded' ? (
			<Check className="size-3.5 text-foreground" />
		) : (
			<X className="size-3.5 text-destructive" />
		);
	return (
		<div className="border-b bg-muted/20 px-4 py-2.5 sm:px-6">
			<div className="flex items-center gap-2 font-mono text-xs">
				{icon}
				<span className="text-command">{block.toolName}</span>
				<span className="text-muted-foreground">
					{block.status === 'running'
						? 'Running'
						: block.status === 'succeeded'
							? 'Completed'
							: 'Failed'}
				</span>
			</div>
		</div>
	);
}

function CommandBlock({
	block,
	coder,
}: {
	block: Extract<CoderBlock, { type: 'command' }>;
	coder: CoderController;
}) {
	const [open, setOpen] = useState(true);
	const failed = block.status === 'failed';
	return (
		<Collapsible open={open} onOpenChange={setOpen} className="border-b bg-code">
			<div className="flex min-h-10 items-center gap-2 px-3 sm:px-5">
				<Terminal className="size-3.5 shrink-0 text-command" />
				<CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 rounded-sm py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
					<code className="truncate font-mono text-xs text-code-foreground">{block.command}</code>
					<ChevronDown
						className={`ml-auto size-3.5 shrink-0 text-muted-foreground transition ${open ? '' : '-rotate-90'}`}
					/>
				</CollapsibleTrigger>
				<Badge variant={failed ? 'destructive' : 'outline'}>
					{block.status === 'running'
						? 'running'
						: block.status === 'cancelled'
							? 'cancelled'
							: `exit ${block.exitCode ?? '?'}`}
				</Badge>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Copy command"
								onClick={() => void navigator.clipboard.writeText(block.command)}
							>
								<Clipboard />
							</Button>
						}
					/>
					<TooltipContent>Copy command</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Copy command output"
								disabled={!block.output}
								onClick={() => void navigator.clipboard.writeText(block.output)}
							>
								<Clipboard />
							</Button>
						}
					/>
					<TooltipContent>Copy output</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Run command again"
								disabled={coder.runState === 'running'}
								onClick={() => {
									coder.setMode('shell');
									coder.setInput(block.command);
									document.querySelector<HTMLTextAreaElement>('#coder-composer')?.focus();
								}}
							>
								<RotateCcw />
							</Button>
						}
					/>
					<TooltipContent>Load command in composer</TooltipContent>
				</Tooltip>
			</div>
			<CollapsibleContent>
				<pre
					className={`max-h-80 overflow-auto border-t px-4 py-3 font-mono text-xs leading-5 whitespace-pre-wrap ${failed ? 'text-destructive' : 'text-code-foreground'}`}
				>
					{block.output ||
						(block.status === 'running' ? 'Waiting for output…' : 'Command produced no output.')}
				</pre>
				{block.truncated ? (
					<p className="border-t px-4 py-2 text-[11px] text-muted-foreground">
						Output was truncated by Pi.
					</p>
				) : null}
			</CollapsibleContent>
		</Collapsible>
	);
}

export function Blocks({ coder }: { coder: CoderController }) {
	return (
		<div>
			{coder.blocks.map((block) =>
				block.type === 'message' ? (
					<MessageBlock key={block.id} block={block} />
				) : block.type === 'tool' ? (
					<ToolBlock key={block.id} block={block} />
				) : (
					<CommandBlock key={block.id} block={block} coder={coder} />
				)
			)}
		</div>
	);
}
