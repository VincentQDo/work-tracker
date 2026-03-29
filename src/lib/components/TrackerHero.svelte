<script lang="ts">
	import MetricCard from '$lib/components/MetricCard.svelte';
	import type { DurationParts, SessionMode, ThemeMode } from '$lib/types/work-tracker';

	let {
		theme,
		mode,
		actionLabel,
		masterDuration,
		workDuration,
		breakDuration,
		currentWorkBlockDuration,
		statusTone,
		statusLabel,
		onThemeChange,
		children
	}: {
		theme: ThemeMode;
		mode: SessionMode;
		actionLabel: string;
		masterDuration: DurationParts;
		workDuration: DurationParts;
		breakDuration: DurationParts;
		currentWorkBlockDuration: DurationParts;
		statusTone: (mode: SessionMode) => string;
		statusLabel: (mode: SessionMode) => string;
		onThemeChange: (theme: ThemeMode) => void;
		children?: import('svelte').Snippet;
	} = $props();
</script>

<section
	class="rounded-[1.75rem] border border-base-300 bg-base-100/75 p-6 shadow-[0_28px_70px_rgba(48,61,99,0.08)] backdrop-blur-[18px] sm:p-7"
>
	<div class="flex flex-col gap-8 lg:flex-row lg:items-stretch">
		<div class="flex-1">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div class="flex flex-wrap items-center gap-3">
					<span class={`badge badge-lg ${statusTone(mode)}`}>{statusLabel(mode)}</span>
					<span class="text-[0.72rem] font-bold tracking-[0.24em] text-base-content/60 uppercase">
						Personal work hours
					</span>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-sm font-semibold text-base-content">
						{theme === 'dark' ? 'Dark' : 'Light'}
					</span>
					<input
						type="checkbox"
						class="toggle toggle-sm"
						checked={theme === 'dark'}
						aria-label="Toggle dark mode"
						onchange={(event) =>
							onThemeChange((event.currentTarget as HTMLInputElement).checked ? 'dark' : 'light')}
					/>
				</div>
			</div>

			<div class="mt-5">
				<p
					class="text-[0.72rem] font-bold tracking-[0.24em] text-base-content/60 uppercase opacity-70"
				>
					Master Timer
				</p>
				<p class="mt-1 text-[clamp(1rem,2vw,1.35rem)] font-bold text-base-content">
					Total session span
				</p>
				<h1
					class="mt-2 text-[clamp(2.75rem,6vw,4.5rem)] font-bold tracking-[-0.06em] text-base-content"
				>
					{masterDuration.clock}
					<span class="text-[0.42em] font-semibold text-base-content/55">
						.{masterDuration.milliseconds}
					</span>
				</h1>
				<p class="mt-3 max-w-[36rem] text-base text-base-content/60">{actionLabel}</p>
			</div>

			<div class="mt-6 grid gap-3 sm:grid-cols-3">
				<MetricCard
					label="Work Today"
					clock={workDuration.clock}
					milliseconds={workDuration.milliseconds}
				/>
				<MetricCard
					label="Break Today"
					clock={breakDuration.clock}
					milliseconds={breakDuration.milliseconds}
				/>
				<MetricCard
					label="Current Work Block"
					clock={currentWorkBlockDuration.clock}
					milliseconds={currentWorkBlockDuration.milliseconds}
				/>
			</div>
		</div>

		<div class="w-full lg:w-[22rem]">
			{@render children?.()}
		</div>
	</div>
</section>
