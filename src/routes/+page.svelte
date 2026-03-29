<script lang="ts">
	import { browser } from '$app/environment';
	import ActivityFeed from '$lib/components/ActivityFeed.svelte';
	import ArchiveFeed from '$lib/components/ArchiveFeed.svelte';
	import TrackerActions from '$lib/components/TrackerActions.svelte';
	import TrackerHero from '$lib/components/TrackerHero.svelte';
	import type {
		ActiveSession,
		ArchivedSession,
		CorrectionTarget,
		SessionEvent,
		SessionEventType,
		SessionMode,
		ThemeMode
	} from '$lib/types/work-tracker';
	import { onDestroy, onMount } from 'svelte';

	const ACTIVE_SESSION_STORAGE_KEY = 'super-stopwatch.active-session';
	const HISTORY_STORAGE_KEY = 'super-stopwatch.history';
	const THEME_STORAGE_KEY = 'super-stopwatch.theme';

	const correctionPresets = [
		{ label: '+5m', amountMs: 5 * 60 * 1000 },
		{ label: '+15m', amountMs: 15 * 60 * 1000 },
		{ label: '+30m', amountMs: 30 * 60 * 1000 },
		{ label: '+1h', amountMs: 60 * 60 * 1000 }
	];

	let session = browser
		? restoreActiveSession(window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY))
		: createEmptySession();
	let history: ArchivedSession[] = browser
		? restoreHistory(window.localStorage.getItem(HISTORY_STORAGE_KEY))
		: [];
	let totals = getLiveTotals(session, Date.now());
	let actionLabel = getActionLabel(session);
	let now = Date.now();
	let isHydrated = false;
	let frameId: number | undefined;
	let theme: ThemeMode = browser
		? restoreTheme(window.localStorage.getItem(THEME_STORAGE_KEY))
		: 'dark';

	function createEmptySession(): ActiveSession {
		return {
			mode: 'idle',
			createdAt: null,
			currentModeStartedAt: null,
			accumulatedWorkMs: 0,
			accumulatedBreakMs: 0,
			currentWorkBlockStartedAt: null,
			lastWorkBlockMs: 0,
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
		amountMs?: number,
		target?: CorrectionTarget,
		direction?: 'add' | 'subtract'
	): SessionEvent {
		return {
			id: createId('evt'),
			type,
			label,
			at,
			amountMs,
			target,
			direction
		};
	}

	function restoreTheme(raw: string | null): ThemeMode {
		return raw === 'light' || raw === 'dark' ? raw : 'dark';
	}

	function restoreActiveSession(raw: string | null): ActiveSession {
		if (!raw) return createEmptySession();

		try {
			const parsed = JSON.parse(raw) as Partial<ActiveSession>;

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
				currentWorkBlockStartedAt:
					typeof parsed.currentWorkBlockStartedAt === 'number'
						? parsed.currentWorkBlockStartedAt
						: null,
				lastWorkBlockMs:
					typeof parsed.lastWorkBlockMs === 'number' ? Math.max(0, parsed.lastWorkBlockMs) : 0,
				events: Array.isArray(parsed.events)
					? parsed.events.filter(isSessionEvent).slice(0, 50)
					: [],
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

			return parsed.filter(isArchivedSession).slice(0, 30);
		} catch {
			return [];
		}
	}

	function isSessionEvent(value: unknown): value is SessionEvent {
		if (!value || typeof value !== 'object') return false;

		const event = value as Partial<SessionEvent>;
		return (
			typeof event.id === 'string' &&
			typeof event.type === 'string' &&
			typeof event.label === 'string' &&
			typeof event.at === 'number'
		);
	}

	function isArchivedSession(value: unknown): value is ArchivedSession {
		if (!value || typeof value !== 'object') return false;

		const entry = value as Partial<ArchivedSession>;
		return (
			typeof entry.id === 'string' &&
			typeof entry.startedAt === 'number' &&
			typeof entry.endedAt === 'number' &&
			typeof entry.workMs === 'number' &&
			typeof entry.breakMs === 'number' &&
			typeof entry.eventCount === 'number'
		);
	}

	function getLiveTotals(state: ActiveSession, timestamp: number) {
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

	function getCurrentWorkBlockMs(state: ActiveSession, timestamp: number) {
		if (state.mode === 'work' && state.currentWorkBlockStartedAt) {
			return Math.max(0, timestamp - state.currentWorkBlockStartedAt);
		}

		return state.lastWorkBlockMs;
	}

	function saveActiveSession(nextSession: ActiveSession) {
		session = nextSession;
		totals = getLiveTotals(session, Date.now());
		actionLabel = getActionLabel(session);

		if (!isHydrated || typeof window === 'undefined') return;
		window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(nextSession));
	}

	function saveHistory(nextHistory: ArchivedSession[]) {
		history = nextHistory;
		if (!isHydrated || typeof window === 'undefined') return;
		window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
	}

	function saveTheme(nextTheme: ThemeMode) {
		theme = nextTheme;
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', nextTheme);
		}

		if (!isHydrated || typeof window === 'undefined') return;
		window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
	}

	function addEvent(nextSession: ActiveSession, event: SessionEvent) {
		return {
			...nextSession,
			events: [event, ...nextSession.events].slice(0, 50),
			updatedAt: event.at
		};
	}

	function startWork() {
		if (session.mode === 'work') return;

		const timestamp = Date.now();
		const nextSession = addEvent(
			{
				...session,
				mode: 'work',
				createdAt: session.createdAt ?? timestamp,
				currentModeStartedAt: timestamp,
				currentWorkBlockStartedAt: timestamp,
				updatedAt: timestamp
			},
			createEvent(
				session.events.length === 0 ? 'session_started' : 'break_ended',
				session.events.length === 0 ? 'Started work session' : 'Returned to work',
				timestamp
			)
		);

		saveActiveSession(nextSession);
	}

	function startBreak() {
		if (session.mode !== 'work' || !session.currentModeStartedAt) return;

		const timestamp = Date.now();
		const elapsedWork = Math.max(0, timestamp - session.currentModeStartedAt);
		const nextSession = addEvent(
			{
				...session,
				mode: 'break',
				accumulatedWorkMs: session.accumulatedWorkMs + elapsedWork,
				currentModeStartedAt: timestamp,
				lastWorkBlockMs: session.currentWorkBlockStartedAt
					? Math.max(0, timestamp - session.currentWorkBlockStartedAt)
					: elapsedWork,
				updatedAt: timestamp
			},
			createEvent('break_started', 'Started break', timestamp)
		);

		saveActiveSession(nextSession);
	}

	function endBreak() {
		if (session.mode !== 'break' || !session.currentModeStartedAt) return;

		const timestamp = Date.now();
		const elapsedBreak = Math.max(0, timestamp - session.currentModeStartedAt);
		const nextSession = addEvent(
			{
				...session,
				mode: 'work',
				accumulatedBreakMs: session.accumulatedBreakMs + elapsedBreak,
				currentModeStartedAt: timestamp,
				currentWorkBlockStartedAt: timestamp,
				updatedAt: timestamp
			},
			createEvent('break_ended', 'Ended break', timestamp)
		);

		saveActiveSession(nextSession);
	}

	function addCorrection(target: CorrectionTarget, amountMs: number) {
		if (amountMs === 0) return;

		const timestamp = Date.now();
		const direction = amountMs > 0 ? 'add' : 'subtract';
		const absoluteAmount = Math.abs(amountMs);
		const nextSession = addEvent(
			{
				...session,
				createdAt: session.createdAt ?? timestamp,
				accumulatedWorkMs:
					target === 'work'
						? Math.max(0, session.accumulatedWorkMs + amountMs)
						: session.accumulatedWorkMs,
				accumulatedBreakMs:
					target === 'break'
						? Math.max(0, session.accumulatedBreakMs + amountMs)
						: session.accumulatedBreakMs,
				updatedAt: timestamp
			},
			createEvent(
				target === 'work'
					? direction === 'add'
						? 'work_added'
						: 'work_removed'
					: direction === 'add'
						? 'break_added'
						: 'break_removed',
				`${direction === 'add' ? 'Added' : 'Subtracted'} ${target === 'work' ? 'work' : 'break'} ${formatSignedDuration(amountMs)}`,
				timestamp,
				absoluteAmount,
				target,
				direction
			)
		);

		saveActiveSession(nextSession);
	}

	function stopDay() {
		if (
			session.mode === 'idle' &&
			session.accumulatedWorkMs === 0 &&
			session.accumulatedBreakMs === 0 &&
			session.events.length === 0
		)
			return;

		const timestamp = Date.now();
		const finalTotals = getLiveTotals(session, timestamp);
		const archivedEntry: ArchivedSession = {
			id: createId('session'),
			startedAt: session.createdAt ?? timestamp,
			endedAt: timestamp,
			workMs: finalTotals.workMs,
			breakMs: finalTotals.breakMs,
			eventCount: session.events.length + 1
		};

		saveHistory([archivedEntry, ...history].slice(0, 30));
		saveActiveSession(createEmptySession());
	}

	function deleteArchivedEntry(id: string) {
		saveHistory(history.filter((entry) => entry.id !== id));
	}

	function clearArchive() {
		if (typeof window !== 'undefined' && !window.confirm('Clear all archived sessions?')) return;
		saveHistory([]);
	}

	function getActionLabel(state: ActiveSession) {
		if (state.mode === 'work') {
			return `Working since ${formatTime(state.currentModeStartedAt)}`;
		}

		if (state.mode === 'break') {
			return `On break since ${formatTime(state.currentModeStartedAt)}`;
		}

		if (state.createdAt) {
			return `Session saved from ${formatTime(state.createdAt)}. Resume when ready.`;
		}

		return 'Start tracking your day';
	}

	function formatDuration(ms: number) {
		const safe = Math.max(0, Math.floor(ms));
		const hours = Math.floor(safe / 3_600_000);
		const minutes = Math.floor((safe % 3_600_000) / 60_000);
		const seconds = Math.floor((safe % 60_000) / 1000);
		const milliseconds = safe % 1000;

		return {
			clock: `${hours.toString().padStart(2, '0')}:${minutes
				.toString()
				.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
			milliseconds: milliseconds.toString().padStart(3, '0')
		};
	}

	function formatShortDuration(ms: number) {
		const totalMinutes = Math.floor(ms / 60_000);
		if (totalMinutes >= 60 && totalMinutes % 60 === 0) {
			return `+${totalMinutes / 60}h`;
		}

		return `+${totalMinutes}m`;
	}

	function formatSignedDuration(ms: number) {
		const totalMinutes = Math.floor(Math.abs(ms) / 60_000);
		const prefix = ms >= 0 ? '+' : '-';
		if (totalMinutes >= 60 && totalMinutes % 60 === 0) {
			return `${prefix}${totalMinutes / 60}h`;
		}

		return `${prefix}${totalMinutes}m`;
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

	function eventTone(event: SessionEvent) {
		const base = 'flex items-start gap-4 rounded-2xl px-4 py-4';
		if (event.type === 'work_added') return `${base} bg-success/10`;
		if (event.type === 'work_removed') return `${base} bg-error/10`;
		if (event.type === 'break_added') return `${base} bg-warning/15`;
		if (event.type === 'break_removed') return `${base} bg-secondary/10`;
		if (event.type === 'break_started') return `${base} bg-warning/10`;
		if (event.type === 'break_ended') return `${base} bg-info/10`;
		return base;
	}

	function eventBadge(event: SessionEvent) {
		if (event.type === 'work_added') return 'badge badge-success badge-outline';
		if (event.type === 'work_removed') return 'badge badge-error badge-outline';
		if (event.type === 'break_added') return 'badge badge-warning badge-outline';
		if (event.type === 'break_removed') return 'badge badge-secondary badge-outline';
		if (event.type === 'break_started') return 'badge badge-warning badge-outline';
		if (event.type === 'break_ended') return 'badge badge-success badge-outline';
		return 'badge badge-outline';
	}

	function syncFromStorage() {
		if (typeof window === 'undefined') return;

		session = restoreActiveSession(window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY));
		history = restoreHistory(window.localStorage.getItem(HISTORY_STORAGE_KEY));
		theme = restoreTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
		document.documentElement.setAttribute('data-theme', theme);
		now = Date.now();
		totals = getLiveTotals(session, now);
		actionLabel = getActionLabel(session);
	}

	function handleStorage(event: StorageEvent) {
		if (
			event.key === ACTIVE_SESSION_STORAGE_KEY ||
			event.key === HISTORY_STORAGE_KEY ||
			event.key === THEME_STORAGE_KEY
		) {
			syncFromStorage();
		}
	}

	onMount(() => {
		isHydrated = true;
		saveTheme(theme);
		syncFromStorage();

		const step = () => {
			now = Date.now();
			totals = getLiveTotals(session, now);
			frameId = window.requestAnimationFrame(step);
		};

		frameId = window.requestAnimationFrame(step);

		window.addEventListener('storage', handleStorage);

		return () => {
			window.removeEventListener('storage', handleStorage);
			if (frameId) window.cancelAnimationFrame(frameId);
		};
	});

	onDestroy(() => {
		if (frameId) cancelAnimationFrame(frameId);
	});
</script>

<svelte:head>
	<title>Work Tracker</title>
	<meta
		name="description"
		content="Track work and break time with persistent local session history."
	/>
</svelte:head>

<div
	class={`min-h-screen ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_top,_rgb(31,41,55),_transparent_42%),linear-gradient(180deg,_rgb(2,6,23),_rgb(15,23,42))]' : 'bg-[radial-gradient(circle_at_top,_rgb(250,245,255),_transparent_36%),linear-gradient(180deg,_rgb(255,251,245),_rgb(243,246,255))]'}`}
	data-theme={theme}
>
	<div
		class={`min-h-screen ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_top_right,_rgb(234_88_12_/_0.18),_transparent_28%),radial-gradient(circle_at_left_center,_rgb(56_189_248_/_0.16),_transparent_22%)]' : 'bg-[radial-gradient(circle_at_top_right,_rgb(255_214_170_/_0.4),_transparent_28%),radial-gradient(circle_at_left_center,_rgb(184_212_255_/_0.35),_transparent_22%)]'}`}
	>
		<div
			class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
		>
			<TrackerHero
				{theme}
				mode={session.mode}
				{actionLabel}
				masterDuration={formatDuration(totals.spanMs)}
				workDuration={formatDuration(totals.workMs)}
				breakDuration={formatDuration(totals.breakMs)}
				currentWorkBlockDuration={formatDuration(getCurrentWorkBlockMs(session, now))}
				{statusTone}
				{statusLabel}
				onThemeChange={saveTheme}
			>
				<TrackerActions
					mode={session.mode}
					canArchive={!(totals.workMs === 0 && totals.breakMs === 0 && session.events.length === 0)}
					{correctionPresets}
					onStartWork={startWork}
					onStartBreak={startBreak}
					onEndBreak={endBreak}
					onStopDay={stopDay}
					onCorrection={addCorrection}
				/>
			</TrackerHero>

			<div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<ActivityFeed
					meta={session.createdAt
						? `Started ${formatTime(session.createdAt)}`
						: 'No active session yet'}
					events={session.events}
					{eventTone}
					{eventBadge}
					{formatTime}
					{formatShortDuration}
				/>

				<ArchiveFeed
					{history}
					{formatTime}
					{formatDate}
					{formatDuration}
					onDeleteEntry={deleteArchivedEntry}
					onClearAll={clearArchive}
				/>
			</div>
		</div>
	</div>
</div>
