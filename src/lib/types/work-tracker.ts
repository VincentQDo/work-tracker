export type SessionMode = 'idle' | 'work' | 'break';
export type CorrectionTarget = 'work' | 'break';
export type ThemeMode = 'light' | 'dark';
export type SessionEventType =
	| 'session_started'
	| 'break_started'
	| 'break_ended'
	| 'work_added'
	| 'break_added'
	| 'work_removed'
	| 'break_removed';

export type SessionEvent = {
	id: string;
	type: SessionEventType;
	label: string;
	at: number;
	amountMs?: number;
	target?: CorrectionTarget;
	direction?: 'add' | 'subtract';
};

export type ActiveSession = {
	mode: SessionMode;
	createdAt: number | null;
	currentModeStartedAt: number | null;
	accumulatedWorkMs: number;
	accumulatedBreakMs: number;
	currentWorkBlockStartedAt: number | null;
	lastWorkBlockMs: number;
	events: SessionEvent[];
	updatedAt: number;
};

export type ArchivedSession = {
	id: string;
	startedAt: number;
	endedAt: number;
	workMs: number;
	breakMs: number;
	eventCount: number;
};

export type DurationParts = {
	clock: string;
	milliseconds: string;
};
