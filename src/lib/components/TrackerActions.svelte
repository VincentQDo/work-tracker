<script lang="ts">
	import type { CorrectionTarget, SessionMode } from '$lib/types/work-tracker';

	let {
		mode,
		canArchive,
		correctionPresets,
		onStartWork,
		onStartBreak,
		onEndBreak,
		onStopDay,
		onCorrection
	}: {
		mode: SessionMode;
		canArchive: boolean;
		correctionPresets: { label: string; amountMs: number }[];
		onStartWork: () => void;
		onStartBreak: () => void;
		onEndBreak: () => void;
		onStopDay: () => void;
		onCorrection: (target: CorrectionTarget, amountMs: number) => void;
	} = $props();
</script>

<div class="rounded-[1.75rem] border border-base-300 bg-base-100/85 p-5 sm:p-6">
	<p class="text-[0.72rem] font-bold tracking-[0.24em] text-base-content/60 uppercase">Actions</p>
	<div class="mt-4 grid gap-3">
		{#if mode === 'idle'}
			<button class="btn w-full btn-lg btn-primary" onclick={onStartWork}>Start work</button>
		{:else if mode === 'work'}
			<button class="btn w-full btn-lg btn-warning" onclick={onStartBreak}>Start break</button>
		{:else}
			<button class="btn w-full btn-lg btn-success" onclick={onEndBreak}>End break</button>
		{/if}

		<button class="btn w-full btn-outline btn-error" onclick={onStopDay} disabled={!canArchive}>
			Stop day and archive
		</button>
	</div>

	<div class="divider my-5">Corrections</div>

	<div class="grid gap-4">
		<div>
			<p class="text-[0.92rem] font-semibold text-base-content">Add missed work time</p>
			<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
				{#each correctionPresets as preset (preset.label)}
					<button
						class="btn min-w-0 justify-center font-semibold btn-sm btn-primary"
						onclick={() => onCorrection('work', preset.amountMs)}
					>
						{preset.label}
					</button>
					<button
						class="btn min-w-0 justify-center font-semibold btn-outline btn-sm btn-error"
						onclick={() => onCorrection('work', -preset.amountMs)}
					>
						-{preset.label.slice(1)}
					</button>
				{/each}
			</div>
		</div>

		<div>
			<p class="text-[0.92rem] font-semibold text-base-content">Add missed break time</p>
			<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
				{#each correctionPresets as preset (preset.label)}
					<button
						class="btn min-w-0 justify-center font-semibold btn-sm btn-warning"
						onclick={() => onCorrection('break', preset.amountMs)}
					>
						{preset.label}
					</button>
					<button
						class="btn min-w-0 justify-center font-semibold btn-outline btn-sm btn-secondary"
						onclick={() => onCorrection('break', -preset.amountMs)}
					>
						-{preset.label.slice(1)}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
