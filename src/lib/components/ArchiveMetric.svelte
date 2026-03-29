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

<div class="metric-surface">
	<p class="text-[color:var(--app-muted)]">{label}</p>
	<p class="mt-1 font-bold text-[color:var(--app-ink)]">
		{clock}
		<span class="text-[0.7em] text-[color:var(--app-muted)]">.{milliseconds}</span>
	</p>
</div>
