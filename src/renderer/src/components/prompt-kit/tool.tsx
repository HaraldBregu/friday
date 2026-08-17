'use client';

import { useState, type CSSProperties } from 'react';
import {
	AudioLines,
	Blocks,
	CalendarClock,
	Camera,
	Check,
	ChevronDown,
	CircleX,
	Image,
	LoaderCircle,
	Mail,
	Mic,
	Monitor,
	PenLine,
	Plug,
	Sparkles,
	Terminal,
	Video,
	Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useNow } from '@/components/hooks/use-now';
import { cn } from '@/lib/utils';
import { formatDuration } from './duration';
import { isExtensionToolType } from './extension';
import { isTaskToolType } from './task';
import { estimateTokens } from './tokens';

export type ToolPart = {
	type: string;
	state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
	status?: 'ok' | 'error' | 'blocked' | 'rejected';
	displayName?: string;
	serviceKind?: string;
	serviceId?: string;
	iteration?: number;
	input?: unknown;
	inputText?: string;
	output?: unknown;
	outputText?: string;
	durationMs?: number;
	toolCallId?: string;
	errorText?: string;
	outputTokens?: number;
	startedAtMs?: number;
};

export type ToolProps = {
	toolPart: ToolPart;
	label?: string;
	defaultOpen?: boolean;
	hideIcon?: boolean;
	className?: string;
	style?: CSSProperties;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function formatValue(value: unknown): string {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') return value;
	if (typeof value === 'object') return JSON.stringify(value, null, 2);
	return String(value);
}

export function toolIcon(toolPart: ToolPart): typeof Wrench {
	const type = toolPart.type.toLowerCase();
	if (isTaskToolType(type)) return CalendarClock;
	if (toolPart.serviceKind === 'mcp' || type.startsWith('mcp__')) return Plug;
	if (isExtensionToolType(type)) return Blocks;
	if (type.includes('skill')) return Sparkles;
	if (type === 'create_image') return Image;
	if (type === 'create_video') return Video;
	if (type === 'create_sound') return AudioLines;
	if (type.includes('email')) return Mail;
	if (type.startsWith('microphone_recorder') || type.startsWith('recorder_microphone')) return Mic;
	if (type.startsWith('camera_recorder') || type.startsWith('recorder_camera')) return Camera;
	if (type.startsWith('screen_recorder') || type.startsWith('recorder_screen')) return Monitor;
	if (type === 'bash') return Terminal;
	if (type === 'write') return PenLine;
	return Wrench;
}

function StatusIcon({ state }: { readonly state: ToolPart['state'] }) {
	if (state === 'output-error') {
		return <CircleX aria-label="Failed" className="size-3 shrink-0 text-destructive" />;
	}
	if (state === 'output-available') {
		return <Check aria-label="Completed" className="size-3 shrink-0 text-muted-foreground/70" />;
	}
	return (
		<LoaderCircle
			aria-label="Running"
			className="size-3 shrink-0 animate-spin text-muted-foreground"
		/>
	);
}

function ToolInput({ input }: { readonly input: unknown }) {
	if (!isRecord(input) || Object.keys(input).length === 0) return null;

	return (
		<div>
			<h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
				Input
			</h4>
			<div className="max-h-40 overflow-auto rounded-sm bg-muted/40 px-2 py-1.5 font-mono text-xs text-muted-foreground">
				{Object.entries(input).map(([key, value]) => (
					<div key={key} className="mb-0.5 break-words last:mb-0">
						<span className="text-foreground/70">{key}:</span>{' '}
						<span>{formatValue(value)}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function ToolOutput({ output }: { readonly output: unknown }) {
	if (output === undefined) return null;

	return (
		<div>
			<h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
				Output
			</h4>
			<div className="max-h-60 overflow-auto rounded-sm bg-muted/40 px-2 py-1.5 font-mono text-xs text-muted-foreground">
				<pre className="whitespace-pre-wrap">{formatValue(output)}</pre>
			</div>
		</div>
	);
}

function Tool({ toolPart, label, defaultOpen = false, hideIcon = false, className, style }: ToolProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const { state, toolCallId } = toolPart;
	const input = toolPart.input ?? (toolPart.inputText ? { raw: toolPart.inputText } : undefined);
	const output = toolPart.output ?? toolPart.outputText;
	const triggerLabel = label ?? toolPart.type;
	const KindIcon = toolIcon(toolPart);
	const isExecuting =
		toolPart.durationMs === undefined &&
		toolPart.startedAtMs !== undefined &&
		(state === 'input-streaming' || state === 'input-available');
	const now = useNow(isExecuting);
	const displayDurationMs =
		toolPart.durationMs ??
		(isExecuting && toolPart.startedAtMs !== undefined
			? Math.max(0, now - toolPart.startedAtMs)
			: undefined);
	const streamingTokens =
		state === 'input-streaming' ? estimateTokens(toolPart.inputText?.length ?? 0) : 0;

	return (
		<div
			className={cn(
				'animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-backwards duration-300 overflow-hidden rounded-md',
				className
			)}
			style={style}
		>
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger
					render={
						<Button
							type="button"
							variant="ghost"
							className="p-0! h-auto w-full justify-start rounded-md bg-transparent! py-1 font-normal text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground"
						>
							<div className="flex w-full min-w-0 items-center gap-1.5">
								{!hideIcon && <KindIcon className="size-3.5 shrink-0 text-muted-foreground/60" />}
								<span
									className={cn(
										'truncate text-xs font-medium',
										label ? 'font-sans' : 'font-mono capitalize'
									)}
								>
									{triggerLabel}
								</span>
								<StatusIcon state={state} />
								{displayDurationMs !== undefined && (
									<span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/50">
										{formatDuration(displayDurationMs)}
									</span>
								)}
								{streamingTokens > 0 ? (
									<span className="ml-auto shrink-0 pl-2 text-[10px] tabular-nums text-muted-foreground/50">
										~{streamingTokens.toLocaleString()} tok
									</span>
								) : (
									toolPart.outputTokens !== undefined &&
									toolPart.outputTokens > 0 && (
										<span className="ml-auto shrink-0 pl-2 text-[10px] tabular-nums text-muted-foreground/50">
											{toolPart.outputTokens.toLocaleString()} tok
										</span>
									)
								)}
								<ChevronDown
									className={cn(
										'size-3 shrink-0 transition-transform duration-200',
										isOpen && 'rotate-180'
									)}
								/>
							</div>
						</Button>
					}
				/>
				<CollapsibleContent>
					<div className="mb-1 mt-0.5 space-y-2 rounded-md border border-border/50 bg-muted/20 p-2">
						<ToolInput input={input} />
						<ToolOutput output={output} />

						{state === 'output-error' && toolPart.errorText && (
							<div>
								<h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-destructive/80">
									Error
								</h4>
								<div className="rounded-sm bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
									{toolPart.errorText}
								</div>
							</div>
						)}

						{state === 'input-streaming' && (
							<div className="text-xs text-muted-foreground">Processing tool call...</div>
						)}

						{toolCallId && (
							<div className="truncate font-mono text-[10px] text-muted-foreground/60">
								{toolCallId}
							</div>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}

export { Tool };
