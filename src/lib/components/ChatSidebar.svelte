<script lang="ts">
	type Conversation = {
		id: string;
		title: string;
		updatedAt: string;
		provider: string;
	};

	let {
		conversations,
		currentId,
		onselect,
		onnewchat,
		ondelete,
		isOpen = $bindable(false)
	} = $props<{
		conversations: Conversation[];
		currentId: string | null;
		onselect: (id: string) => void;
		onnewchat: () => void;
		ondelete: (id: string) => void;
		isOpen: boolean;
	}>();

	let search = $state('');

	const filtered = $derived(
		search
			? conversations.filter((c: Conversation) => c.title.toLowerCase().includes(search.toLowerCase()))
			: conversations
	);

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days}d ago`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700/50">
	{#if isOpen}
		<!-- Expanded sidebar -->

		<!-- Header with toggle -->
		<div class="p-3 border-b border-gray-200 dark:border-gray-700/50 flex items-center gap-2">
			<button
				onclick={() => (isOpen = false)}
				class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-all"
				title="Collapse sidebar"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7" />
				</svg>
			</button>
			<button
				onclick={onnewchat}
				class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
					bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md shadow-violet-500/20
					hover:from-violet-500 hover:to-blue-500 transition-all duration-200"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				New Chat
			</button>
		</div>

		<!-- Search -->
		<div class="px-3 py-2">
			<div class="relative">
				<svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					type="text"
					bind:value={search}
					placeholder="Search chats..."
					class="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
				/>
			</div>
		</div>

		<!-- Conversation List -->
		<div class="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
			{#if filtered.length === 0}
				<p class="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
					{search ? 'No chats match your search' : 'No conversations yet'}
				</p>
			{/if}

			{#each filtered as convo (convo.id)}
				<div class="flex items-center gap-1 pr-1">
					<button
						onclick={() => onselect(convo.id)}
						class="flex-1 min-w-0 text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150
							{currentId === convo.id
								? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
								: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'}"
					>
						<div class="flex items-center gap-2">
							<svg class="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
							<span class="truncate font-medium block">{convo.title}</span>
						</div>
						<span class="text-[10px] text-gray-400 dark:text-gray-500 ml-5.5 block mt-0.5">{formatDate(convo.updatedAt)}</span>
					</button>

					<!-- Delete button -->
					<button
						onclick={(e) => { e.stopPropagation(); ondelete(convo.id); }}
						class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150 border border-red-200/50 dark:border-red-800/30"
						title="Delete chat"
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Collapsed sidebar - just toggle button and new chat -->
		<div class="flex flex-col items-center py-3 gap-3">
			<button
				onclick={() => (isOpen = true)}
				class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-all"
				title="Expand sidebar"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7" />
				</svg>
			</button>
			<button
				onclick={onnewchat}
				class="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-blue-500 transition-all"
				title="New Chat"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
			</button>
		</div>
	{/if}
</div>
