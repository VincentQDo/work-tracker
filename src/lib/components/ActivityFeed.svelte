<script lang="ts">
	import PanelSection from '$lib/components/PanelSection.svelte';
	import type { SessionEvent } from '$lib/types/work-tracker';

	let {
		meta,
		events,
		eventTone,
		eventBadge,
		formatTime,
		formatShortDuration
	}: {
		meta: string;
		events: SessionEvent[];
		eventTone: (event: SessionEvent) => string;
		eventBadge: (event: SessionEvent) => string;
		formatTime: (timestamp: number | null) => string;
		formatShortDuration: (ms: number) => string;
	} = $props();
</script>

<PanelSection eyebrow="Current day timeline" title="Recent activity" {meta}>
	{#if events.length > 0}
		<ul class="mt-6 max-h-[32.5rem] space-y-3 overflow-y-auto pr-1">
			{#each events as event (event.id)}
				<li class={eventTone(event)}>
					<div
						class="mt-[0.3rem] h-[0.8rem] w-[0.8rem] shrink-0 rounded-full bg-linear-to-br from-blue-500 to-sky-400 shadow-[0_0_0_6px_rgba(59,130,246,0.12)]"
					></div>
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<p class="font-semibold text-base-content">{event.label}</p>
							<div class="flex flex-wrap items-center gap-2">
								{#if event.direction && event.target}
									<span class={eventBadge(event)}>
										{event.direction === 'add' ? 'Added' : 'Subtracted'}
										{event.target}
									</span>
								{/if}
								<span class="text-base-content/60">{formatTime(event.at)}</span>
							</div>
						</div>
						{#if event.amountMs}
							<p class="text-sm text-base-content/60">
								Manual correction {event.direction === 'subtract' ? '-' : '+'}{formatShortDuration(
									event.amountMs
								).slice(1)}
							</p>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="mt-6 rounded-3xl border border-base-300 bg-base-200/60 p-4">
			<p class="font-semibold text-base-content">No activity yet</p>
			<p class="mt-1 text-sm text-base-content/60">
				Start work to create a session, then track breaks and missed time corrections.
			</p>
		</div>
	{/if}
</PanelSection>
