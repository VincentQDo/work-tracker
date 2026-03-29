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

<div class="rounded-2xl border border-base-300 bg-base-100/80 p-3">
	<p class="text-base-content/60">{label}</p>
	<p class="mt-1 font-bold text-base-content">
		{clock}
		<span class="text-[0.7em] text-base-content/55">.{milliseconds}</span>
	</p>
</div>
