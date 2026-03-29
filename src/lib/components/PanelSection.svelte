<script lang="ts">
	type Snippet = import('svelte').Snippet;

	let {
		title,
		eyebrow,
		meta = '',
		badgeText = '',
		children
	}: {
		title: string;
		eyebrow: string;
		meta?: string;
		badgeText?: string;
		children?: Snippet;
	} = $props();
</script>

<section class="panel-surface panel-pad">
	<div class="flex items-center justify-between gap-4">
		<div>
			<p class="text-[0.72rem] font-bold tracking-[0.24em] text-[color:var(--app-muted)] uppercase">
				{eyebrow}
			</p>
			<h2 class="mt-1 text-2xl font-bold text-[color:var(--app-ink)]">{title}</h2>
		</div>
		{#if badgeText}
			<span class="badge badge-outline">{badgeText}</span>
		{:else if meta}
			<p class="text-[0.95rem] text-[color:var(--app-muted)]">{meta}</p>
		{/if}
	</div>

	{@render children?.()}
</section>
