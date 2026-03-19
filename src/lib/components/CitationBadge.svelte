<script lang="ts">
	import type { Citation } from '$lib/chat';

	let { citations } = $props<{ citations: Citation[] }>();
	let expandedIdx = $state<number | null>(null);

	function toggle(idx: number) {
		expandedIdx = expandedIdx === idx ? null : idx;
	}
</script>

{#if citations.length > 0}
	<div class="mt-2 space-y-1">
		<p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sources</p>
		<div class="flex flex-wrap gap-1.5">
			{#each citations as citation, i}
				<button
					onclick={() => toggle(i)}
					class="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all duration-200
						{expandedIdx === i
							? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600 shadow-sm'
							: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-700'}"
					title="Click to see source snippet"
				>
					<span class="inline-flex items-center gap-1">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						[{i + 1}] {citation.filename}
					</span>
				</button>
			{/each}
		</div>

		{#if expandedIdx !== null && citations[expandedIdx]}
			<div class="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 animate-fade-in">
				<div class="flex items-center justify-between mb-1.5">
					<span class="font-semibold text-gray-700 dark:text-gray-300">
						{citations[expandedIdx].filename} — Chunk {citations[expandedIdx].chunkIndex + 1}
					</span>
					<span class="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
						{(citations[expandedIdx].similarity * 100).toFixed(0)}% match
					</span>
				</div>
				<p class="leading-relaxed whitespace-pre-wrap">{citations[expandedIdx].snippet}</p>
			</div>
		{/if}
	</div>
{/if}
