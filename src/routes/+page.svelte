<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type SessionMode = 'idle' | 'work' | 'break';
	type CorrectionTarget = 'work' | 'break';
	type SessionEventType =
		| 'session_started'
		| 'break_started'
		| 'break_ended'
		| 'work_added'
		| 'break_added'
		| 'session_stopped';

	type SessionEvent = {
		id: string;
		type: SessionEventType;
		label: string;
		at: number;
		amountMs?: number;
	};

	type SessionState = {
		mode: SessionMode;
		createdAt: number | null;
		currentModeStartedAt: number | null;
		accumulatedWorkMs: number;
		accumulatedBreakMs: number;
		events: SessionEvent[];
		updatedAt: number;
	};

	type ArchivedSession = {
		id: string;
		startedAt: number;
		endedAt: number;
		workMs: number;
		breakMs: number;
		events: SessionEvent[];
	};

	const SESSION_STORAGE_KEY = 'super-stopwatch.active-session';
	const HISTORY_STORAGE_KEY = 'super-stopwatch.history';

	const correctionPresets = [
		{ label: '+5m', amountMs: 5 * 60 * 1000 },
		{ label: '+15m', amountMs: 15 * 60 * 1000 },
		{ label: '+30m', amountMs: 30 * 60 * 1000 },
		{ label: '+1h', amountMs: 60 * 60 * 1000 }
	];

	let session = createEmptySession();
	let history: ArchivedSession[] = [];
	let now = Date.now();
	let isHydrated = false;
	let intervalId: number | undefined;

	function createEmptySession(): SessionState {
		return {
			mode: 'idle',
			createdAt: null,
			currentModeStartedAt: null,
			accumulatedWorkMs: 0,
			accumulatedBreakMs: 0,
			events: [],
			updatedAt: Date.now()
		};
	}

	function createId(prefix: string) {
		return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	}

	function createEvent(
		type: SessionEventType,
		label: string,
		at: number,
		amountMs?: number
	): SessionEvent {
		return {
			id: createId('evt'),
			type,
			label,
			at,
			amountMs
		};
	}

	function restoreSession(raw: string | null): SessionState {
		if (!raw) return createEmptySession();

		try {
			const parsed = JSON.parse(raw) as Partial<SessionState>;

			return {
				mode:
					parsed.mode === 'work' || parsed.mode === 'break' || parsed.mode === 'idle'
						? parsed.mode
						: 'idle',
				createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : null,
				currentModeStartedAt:
					typeof parsed.currentModeStartedAt === 'number' ? parsed.currentModeStartedAt : null,
				accumulatedWorkMs:
					typeof parsed.accumulatedWorkMs === 'number' ? Math.max(0, parsed.accumulatedWorkMs) : 0,
				accumulatedBreakMs:
					typeof parsed.accumulatedBreakMs === 'number'
						? Math.max(0, parsed.accumulatedBreakMs)
						: 0,
				events: Array.isArray(parsed.events) ? parsed.events.slice(0, 50) : [],
				updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now()
			};
		} catch {
			return createEmptySession();
		}
	}

	function restoreHistory(raw: string | null): ArchivedSession[] {
		if (!raw) return [];

		try {
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];

			return parsed.filter((entry): entry is ArchivedSession => {
				return (
					entry &&
					typeof entry.id === 'string' &&
					typeof entry.startedAt === 'number' &&
					typeof entry.endedAt === 'number' &&
					typeof entry.workMs === 'number' &&
					typeof entry.breakMs === 'number' &&
					Array.isArray(entry.events)
				);
			});
		} catch {
			return [];
		}
	}

	function persistSession() {
		if (!isHydrated || typeof window === 'undefined') return;
		window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
	}

	function persistHistory() {
		if (!isHydrated || typeof window === 'undefined') return;
		window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
	}

	function liveTotals(state: SessionState, timestamp: number) {
		let workMs = state.accumulatedWorkMs;
		let breakMs = state.accumulatedBreakMs;

		if (state.mode === 'work' && state.currentModeStartedAt) {
			workMs += Math.max(0, timestamp - state.currentModeStartedAt);
		}

		if (state.mode === 'break' && state.currentModeStartedAt) {
			breakMs += Math.max(0, timestamp - state.currentModeStartedAt);
		}

		return {
			workMs,
			breakMs,
			spanMs: workMs + breakMs
		};
	}

	function appendEvent(event: SessionEvent) {
		session = {
			...session,
			events: [event, ...session.events].slice(0, 50),
			updatedAt: event.at
		};
	}

	function startWork() {
		if (session.mode === 'work') return;

		const timestamp = Date.now();
		const nextCreatedAt = session.createdAt ?? timestamp;
		session = {
			...session,
			mode: 'work',
			createdAt: nextCreatedAt,
			currentModeStartedAt: timestamp,
			updatedAt: timestamp
		};

		appendEvent(
			session.events.length === 0
				? createEvent('session_started', 'Started work session', timestamp)
				: createEvent('break_ended', 'Returned to work', timestamp)
		);
	}

	function startBreak() {
		if (session.mode !== 'work' || !session.currentModeStartedAt) return;

		const timestamp = Date.now();
		const elapsedWork = Math.max(0, timestamp - session.currentModeStartedAt);

		session = {
			...session,
			mode: 'break',
			accumulatedWorkMs: session.accumulatedWorkMs + elapsedWork,
			currentModeStartedAt: timestamp,
			updatedAt: timestamp
		};

		appendEvent(createEvent('break_started', 'Started break', timestamp));
	}

	function endBreak() {
		if (session.mode !== 'break' || !session.currentModeStartedAt) return;

		const timestamp = Date.now();
		const elapsedBreak = Math.max(0, timestamp - session.currentModeStartedAt);

		session = {
			...session,
			mode: 'work',
			accumulatedBreakMs: session.accumulatedBreakMs + elapsedBreak,
			currentModeStartedAt: timestamp,
			updatedAt: timestamp
		};

		appendEvent(createEvent('break_ended', 'Ended break', timestamp));
	}

	function addCorrection(target: CorrectionTarget, amountMs: number) {
		if (amountMs <= 0) return;

		const timestamp = Date.now();
		session = {
			...session,
			accumulatedWorkMs:
				target === 'work' ? session.accumulatedWorkMs + amountMs : session.accumulatedWorkMs,
			accumulatedBreakMs:
				target === 'break' ? session.accumulatedBreakMs + amountMs : session.accumulatedBreakMs,
			createdAt: session.createdAt ?? timestamp,
			updatedAt: timestamp
		};

		appendEvent(
			createEvent(
				target === 'work' ? 'work_added' : 'break_added',
				`${target === 'work' ? 'Added missed work' : 'Added missed break'} ${formatShortDuration(amountMs)}`,
				timestamp,
				amountMs
			)
		);
	}

	function stopDay() {
		if (
			session.mode === 'idle' &&
			session.accumulatedWorkMs === 0 &&
			session.accumulatedBreakMs === 0
		)
			return;

		const timestamp = Date.now();
		const totals = liveTotals(session, timestamp);
		const stoppedEvent = createEvent(
			'session_stopped',
			'Stopped day and archived session',
			timestamp
		);
		const archived: ArchivedSession = {
			id: createId('session'),
			startedAt: session.createdAt ?? timestamp,
			endedAt: timestamp,
			workMs: totals.workMs,
			breakMs: totals.breakMs,
			events: [stoppedEvent, ...session.events]
		};

		history = [archived, ...history].slice(0, 14);
		session = createEmptySession();
	}

	function formatDuration(ms: number) {
		const safe = Math.max(0, Math.floor(ms));
		const hours = Math.floor(safe / 3_600_000);
		const minutes = Math.floor((safe % 3_600_000) / 60_000);
		const seconds = Math.floor((safe % 60_000) / 1000);

		return `${hours.toString().padStart(2, '0')}:${minutes
			.toString()
			.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	function formatShortDuration(ms: number) {
		const totalMinutes = Math.floor(ms / 60_000);
		if (totalMinutes >= 60 && totalMinutes % 60 === 0) {
			return `+${totalMinutes / 60}h`;
		}

		return `+${totalMinutes}m`;
	}

	function formatTime(timestamp: number | null) {
		if (!timestamp) return 'Not started';

		return new Intl.DateTimeFormat(undefined, {
			hour: 'numeric',
			minute: '2-digit'
		}).format(timestamp);
	}

	function formatDate(timestamp: number) {
		return new Intl.DateTimeFormat(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		}).format(timestamp);
	}

	function statusLabel(mode: SessionMode) {
		if (mode === 'work') return 'Working';
		if (mode === 'break') return 'On break';
		return 'Idle';
	}

	function statusTone(mode: SessionMode) {
		if (mode === 'work') return 'badge-success';
		if (mode === 'break') return 'badge-warning';
		return 'badge-neutral';
	}

	function handleStorage(event: StorageEvent) {
		if (event.key === SESSION_STORAGE_KEY) {
			session = restoreSession(event.newValue);
		}

		if (event.key === HISTORY_STORAGE_KEY) {
			history = restoreHistory(event.newValue);
		}
	}

	onMount(() => {
		session = restoreSession(window.localStorage.getItem(SESSION_STORAGE_KEY));
		history = restoreHistory(window.localStorage.getItem(HISTORY_STORAGE_KEY));
		isHydrated = true;
		now = Date.now();

		intervalId = window.setInterval(() => {
			now = Date.now();
		}, 250);

		window.addEventListener('storage', handleStorage);

		return () => {
			window.removeEventListener('storage', handleStorage);
			if (intervalId) window.clearInterval(intervalId);
		};
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
	});

	$: if (isHydrated) persistSession();
	$: if (isHydrated) persistHistory();
	$: totals = liveTotals(session, now);
	$: actionLabel =
		session.mode === 'work'
			? `Working since ${formatTime(session.currentModeStartedAt)}`
			: session.mode === 'break'
				? `On break since ${formatTime(session.currentModeStartedAt)}`
				: session.createdAt
					? `Ready to resume from ${formatTime(session.createdAt)}`
					: 'Start tracking your day';
</script>

<svelte:head>
	<title>Work Tracker</title>
	<meta
		name="description"
		content="Track work and break time with persistent local session history."
	/>
</svelte:head>

<div class="page-shell">
	<div class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
		<section class="hero-card">
			<div class="flex flex-col gap-8 lg:flex-row lg:items-stretch">
				<div class="flex-1">
					<div class="flex flex-wrap items-center gap-3">
						<span class={`badge badge-lg ${statusTone(session.mode)}`}
							>{statusLabel(session.mode)}</span
						>
						<span class="text-sm font-medium tracking-[0.24em] text-base-content/55 uppercase">
							Personal work hours
						</span>
					</div>

					<div class="mt-5">
						<p class="text-sm tracking-[0.3em] text-base-content/45 uppercase">Today</p>
						<h1 class="mt-2 text-4xl font-semibold tracking-tight text-base-content sm:text-5xl">
							{formatDuration(totals.workMs)}
						</h1>
						<p class="mt-3 max-w-xl text-base text-base-content/65 sm:text-lg">{actionLabel}</p>
					</div>

					<div class="mt-6 grid gap-3 sm:grid-cols-3">
						<div class="stat-tile">
							<span class="stat-label">Work</span>
							<span class="stat-value">{formatDuration(totals.workMs)}</span>
						</div>
						<div class="stat-tile">
							<span class="stat-label">Break</span>
							<span class="stat-value">{formatDuration(totals.breakMs)}</span>
						</div>
						<div class="stat-tile">
							<span class="stat-label">Session span</span>
							<span class="stat-value">{formatDuration(totals.spanMs)}</span>
						</div>
					</div>
				</div>

				<div class="action-panel lg:w-[22rem]">
					<p class="panel-label">Actions</p>
					<div class="mt-4 grid gap-3">
						{#if session.mode === 'idle'}
							<button class="btn w-full btn-lg btn-primary" on:click={startWork}>Start work</button>
						{:else if session.mode === 'work'}
							<button class="btn w-full btn-lg btn-warning" on:click={startBreak}
								>Start break</button
							>
						{:else}
							<button class="btn w-full btn-lg btn-success" on:click={endBreak}>End break</button>
						{/if}

						<button
							class="btn w-full btn-outline btn-error"
							on:click={stopDay}
							disabled={totals.workMs === 0 && totals.breakMs === 0}
						>
							Stop day and archive
						</button>
					</div>

					<div class="divider my-5">Corrections</div>

					<div class="grid gap-4">
						<div>
							<p class="panel-subtitle">Add missed work time</p>
							<div class="mt-2 flex flex-wrap gap-2">
								{#each correctionPresets as preset (preset.label)}
									<button
										class="btn btn-soft btn-sm btn-primary"
										on:click={() => addCorrection('work', preset.amountMs)}
									>
										{preset.label}
									</button>
								{/each}
							</div>
						</div>

						<div>
							<p class="panel-subtitle">Add missed break time</p>
							<div class="mt-2 flex flex-wrap gap-2">
								{#each correctionPresets as preset (preset.label)}
									<button
										class="btn btn-soft btn-sm btn-warning"
										on:click={() => addCorrection('break', preset.amountMs)}
									>
										{preset.label}
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
			<section class="panel-card">
				<div class="flex items-center justify-between gap-4">
					<div>
						<p class="panel-label">Current day timeline</p>
						<h2 class="mt-1 text-2xl font-semibold">Recent activity</h2>
					</div>
					<p class="text-sm text-base-content/55">
						{session.createdAt
							? `Started ${formatTime(session.createdAt)}`
							: 'No active session yet'}
					</p>
				</div>

				{#if session.events.length > 0}
					<ul class="mt-6 space-y-3">
						{#each session.events as event (event.id)}
							<li class="timeline-row">
								<div class="timeline-dot"></div>
								<div class="flex-1">
									<div class="flex flex-wrap items-center justify-between gap-2">
										<p class="font-medium text-base-content">{event.label}</p>
										<span class="text-sm text-base-content/50">{formatTime(event.at)}</span>
									</div>
									{#if event.amountMs}
										<p class="mt-1 text-sm text-base-content/55">
											Manual correction {formatShortDuration(event.amountMs)}
										</p>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<div class="empty-state mt-6">
						<p class="text-lg font-medium">No activity yet</p>
						<p class="mt-1 text-sm text-base-content/60">
							Start work to create a session, then track breaks and missed time corrections.
						</p>
					</div>
				{/if}
			</section>

			<section class="panel-card">
				<div class="flex items-center justify-between gap-4">
					<div>
						<p class="panel-label">Archive</p>
						<h2 class="mt-1 text-2xl font-semibold">Recent days</h2>
					</div>
					<span class="badge badge-outline">{history.length} saved</span>
				</div>

				{#if history.length > 0}
					<div class="mt-6 space-y-3">
						{#each history as entry (entry.id)}
							<div class="archive-card">
								<div class="flex items-start justify-between gap-3">
									<div>
										<p class="font-semibold text-base-content">{formatDate(entry.startedAt)}</p>
										<p class="text-sm text-base-content/55">
											{formatTime(entry.startedAt)} to {formatTime(entry.endedAt)}
										</p>
									</div>
									<span class="badge badge-ghost">{entry.events.length} events</span>
								</div>

								<div class="mt-4 grid grid-cols-3 gap-2 text-sm">
									<div class="rounded-2xl bg-base-100/80 px-3 py-2">
										<p class="text-base-content/50">Work</p>
										<p class="mt-1 font-semibold">{formatDuration(entry.workMs)}</p>
									</div>
									<div class="rounded-2xl bg-base-100/80 px-3 py-2">
										<p class="text-base-content/50">Break</p>
										<p class="mt-1 font-semibold">{formatDuration(entry.breakMs)}</p>
									</div>
									<div class="rounded-2xl bg-base-100/80 px-3 py-2">
										<p class="text-base-content/50">Span</p>
										<p class="mt-1 font-semibold">{formatDuration(entry.workMs + entry.breakMs)}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-state mt-6">
						<p class="text-lg font-medium">No archived days yet</p>
						<p class="mt-1 text-sm text-base-content/60">
							Use “Stop day and archive” to save the finished session locally.
						</p>
					</div>
				{/if}
			</section>
		</div>
	</div>
</div>
