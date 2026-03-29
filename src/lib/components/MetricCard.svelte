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

<div class="rounded-3xl border border-base-300 bg-base-100/80 p-4 text-base-content">
	<span class="text-[0.72rem] font-bold tracking-[0.24em] text-base-content/60 uppercase">
		{label}
	</span>
	<span class="block text-[1.45rem] font-bold tracking-[-0.03em] text-base-content">
		{clock}
		<span class="text-[0.7em] text-base-content/55">.{milliseconds}</span>
	</span>
</div>
