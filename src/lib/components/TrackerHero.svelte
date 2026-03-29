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
					<label class="swap swap-rotate text-base-content">
						<input
							type="checkbox"
							class="theme-controller hidden"
							value="dark"
							checked={theme === 'dark'}
							aria-label="Toggle dark mode"
							onchange={(event) =>
								onThemeChange((event.currentTarget as HTMLInputElement).checked ? 'dark' : 'light')}
						/>

						<svg
							class="swap-off h-8 w-8 fill-current"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
						>
							<path
								d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"
							/>
						</svg>

						<svg
							class="swap-on h-8 w-8 fill-current"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
						>
							<path
								d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"
							/>
						</svg>
					</label>
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
