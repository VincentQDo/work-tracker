<script lang="ts">
	let {
		label,
		clock,
		milliseconds
	}: {
		label: string;
		clock: string;
		milliseconds: string;
	} = $props();
</script>

<div
	class="rounded-3xl border border-[color:var(--surface-border)] bg-[color:var(--surface-soft)] p-4 text-[color:var(--app-ink)]"
>
	<span class="text-[0.72rem] font-bold tracking-[0.24em] text-[color:var(--app-muted)] uppercase">
		{label}
	</span>
	<span class="block text-[1.45rem] font-bold tracking-[-0.03em] text-[color:var(--app-ink)]">
		{clock}
		<span class="text-[0.7em] text-[color:var(--app-muted)]">.{milliseconds}</span>
	</span>
</div>
