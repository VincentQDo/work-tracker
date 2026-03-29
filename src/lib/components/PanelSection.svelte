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

<section
	class="rounded-[1.75rem] border border-base-300 bg-base-100/75 p-6 shadow-[0_28px_70px_rgba(48,61,99,0.08)] backdrop-blur-[18px] sm:p-7"
>
	<div class="flex items-center justify-between gap-4">
		<div>
			<p class="text-[0.72rem] font-bold tracking-[0.24em] text-base-content/60 uppercase">
				{eyebrow}
			</p>
			<h2 class="mt-1 text-2xl font-bold text-base-content">{title}</h2>
		</div>
		{#if badgeText}
			<span class="badge badge-outline">{badgeText}</span>
		{:else if meta}
			<p class="text-[0.95rem] text-base-content/60">{meta}</p>
		{/if}
	</div>

	{@render children?.()}
</section>
