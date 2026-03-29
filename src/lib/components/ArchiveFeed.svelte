<script lang="ts">
	import ArchiveMetric from '$lib/components/ArchiveMetric.svelte';
	import PanelSection from '$lib/components/PanelSection.svelte';
	import type { ArchivedSession, DurationParts } from '$lib/types/work-tracker';

	let {
		history,
		formatTime,
		formatDate,
		formatDuration
	}: {
		history: ArchivedSession[];
		formatTime: (timestamp: number | null) => string;
		formatDate: (timestamp: number) => string;
		formatDuration: (ms: number) => DurationParts;
	} = $props();
</script>

<PanelSection eyebrow="Archive" title="Recent days" badgeText={`${history.length} saved`}>
	{#if history.length > 0}
		<div class="mt-6 space-y-3">
			{#each history as entry (entry.id)}
				<div class="rounded-3xl border border-base-300 bg-base-200/60 p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="font-semibold text-base-content">{formatDate(entry.startedAt)}</p>
							<p class="text-base-content/60">
								{formatTime(entry.startedAt)} to {formatTime(entry.endedAt)}
							</p>
						</div>
						<span class="badge badge-ghost">{entry.eventCount} updates</span>
					</div>

					<div class="mt-4 grid grid-cols-3 gap-2 text-sm">
						<ArchiveMetric
							label="Work"
							clock={formatDuration(entry.workMs).clock}
							milliseconds={formatDuration(entry.workMs).milliseconds}
						/>
						<ArchiveMetric
							label="Break"
							clock={formatDuration(entry.breakMs).clock}
							milliseconds={formatDuration(entry.breakMs).milliseconds}
						/>
						<ArchiveMetric
							label="Span"
							clock={formatDuration(entry.workMs + entry.breakMs).clock}
							milliseconds={formatDuration(entry.workMs + entry.breakMs).milliseconds}
						/>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="mt-6 rounded-3xl border border-base-300 bg-base-200/60 p-4">
			<p class="font-semibold text-base-content">No archived days yet</p>
			<p class="mt-1 text-sm text-base-content/60">
				Use “Stop day and archive” to save the finished session locally.
			</p>
		</div>
	{/if}
</PanelSection>
