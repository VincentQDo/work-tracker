<script lang="ts">
	import { onDestroy } from 'svelte';

	let time = 0; // Total elapsed time in ms
	let isRunning = false;
	let startTime = 0;
	let frameId: number;

	function start() {
		if (isRunning) return;
		isRunning = true;
		// Adjust start time to account for time already elapsed
		startTime = performance.now() - time;

		function loop(now: number) {
			if (!isRunning) return;
			time = now - startTime;
			frameId = requestAnimationFrame(loop);
		}

		frameId = requestAnimationFrame(loop);
	}

	function stop() {
		isRunning = false;
		cancelAnimationFrame(frameId);
	}

	function reset() {
		stop();
		time = 0;
	}

	function adjustTime(amount: number) {
		time += amount;

		// Prevent negative time
		if (time < 0) time = 0;

		// If running, we must shift the startTime anchor so the
		// next animation frame calculates the duration correctly from this new point.
		if (isRunning) {
			startTime = performance.now() - time;
		}
	}

	// Format milliseconds into MM:SS:MS
	function formatTime(ms: number) {
		// Prevent formatting issues if time is slightly negative during calculation
		const safeMs = Math.max(0, ms);

		const hours = Math.floor(safeMs / 3600000);
		const minutes = Math.floor((safeMs % 3600000) / 60000);
		const seconds = Math.floor((safeMs % 60000) / 1000);
		const milliseconds = Math.floor((safeMs % 1000) / 10);

		return {
			hr: hours.toString().padStart(2, '0'),
			min: minutes.toString().padStart(2, '0'),
			sec: seconds.toString().padStart(2, '0'),
			ms: milliseconds.toString().padStart(2, '0')
		};
	}

	onDestroy(() => {
		if (typeof window !== 'undefined') cancelAnimationFrame(frameId);
	});

	$: display = formatTime(time);
</script>

<div class="hero min-h-screen bg-base-200">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<h1 class="mb-8 text-5xl font-bold text-primary">Stopwatch</h1>

			<div class="card mb-8 border-2 border-base-300 bg-base-100 shadow-xl">
				<div class="card-body p-10">
					<div class="flex justify-center gap-2 text-center">
						<div class="flex flex-col">
							<span class="countdown font-mono text-6xl">
								<span style="--value:{display.hr}; --digits:2"></span>
							</span>
							<span class="mt-2 text-xs uppercase opacity-70">hr</span>
						</div>
						<span class="font-mono text-6xl">:</span>

						<div class="flex flex-col">
							<span class="countdown font-mono text-6xl">
								<span style="--value:{display.min}; --digits:2"></span>
							</span>
							<span class="mt-2 text-xs uppercase opacity-70">min</span>
						</div>
						<span class="font-mono text-6xl">:</span>

						<div class="flex flex-col">
							<span class="countdown font-mono text-6xl">
								<span style="--value:{display.sec}; --digits:2"></span>
							</span>
							<span class="mt-2 text-xs uppercase opacity-70">sec</span>
						</div>
						<span class="font-mono text-6xl">:</span>

						<div class="flex flex-col">
							<span class="font-mono text-6xl">
								{display.ms}
							</span>
							<span class="mt-2 text-xs uppercase opacity-70">ms</span>
						</div>
					</div>
				</div>
			</div>

			<div class="mb-6 flex justify-center gap-4">
				<div class="join">
					<button class="btn join-item btn-sm" on:click={() => adjustTime(-60000)}>-1m</button>
					<button class="btn join-item btn-sm" on:click={() => adjustTime(-10000)}>-10s</button>
					<button class="btn join-item btn-sm" on:click={() => adjustTime(-1000)}>-1s</button>
				</div>
				<div class="join">
					<button class="btn join-item btn-sm" on:click={() => adjustTime(1000)}>+1s</button>
					<button class="btn join-item btn-sm" on:click={() => adjustTime(10000)}>+10s</button>
					<button class="btn join-item btn-sm" on:click={() => adjustTime(60000)}>+1m</button>
				</div>
			</div>

			<div class="join grid grid-cols-3 gap-2">
				<button
					class="btn join-item btn-outline btn-error"
					on:click={reset}
					disabled={time === 0 && !isRunning}
				>
					Reset
				</button>

				{#if !isRunning}
					<button class="btn join-item btn-primary" on:click={start}> Start </button>
				{:else}
					<button class="btn join-item btn-warning" on:click={stop}> Stop </button>
				{/if}
			</div>
		</div>
	</div>
</div>
