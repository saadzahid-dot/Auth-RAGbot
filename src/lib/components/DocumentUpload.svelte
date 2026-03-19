<script lang="ts">
	type Document = {
		id: string;
		filename: string;
		mimeType: string;
		fileSize: number;
		chunkCount: number;
		status: string;
		createdAt: string;
	};

	let { documents: docs = [], onupload, ondelete } = $props<{
		documents: Document[];
		onupload: (file: File) => Promise<void>;
		ondelete: (id: string) => Promise<void>;
	}>();

	let isDragging = $state(false);
	let isUploading = $state(false);
	let fileInput: HTMLInputElement;

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function statusColor(status: string): string {
		if (status === 'ready') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
		if (status === 'processing') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
		return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
	}

	async function handleFiles(files: FileList | null) {
		if (!files || files.length === 0) return;
		isUploading = true;
		try {
			for (const file of files) {
				await onupload(file);
			}
		} finally {
			isUploading = false;
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		handleFiles(e.dataTransfer?.files || null);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}
</script>

<div class="space-y-4">
	<!-- Upload zone -->
	<div
		ondrop={handleDrop}
		ondragover={handleDragOver}
		ondragleave={() => isDragging = false}
		onclick={() => fileInput.click()}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Enter') fileInput.click(); }}
		class="relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
			{isDragging
				? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
				: 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'}"
	>
		<input
			bind:this={fileInput}
			type="file"
			accept=".txt,.pdf,text/plain,application/pdf"
			multiple
			class="hidden"
			onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}
		/>

		{#if isUploading}
			<div class="flex flex-col items-center gap-2">
				<div class="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
				<p class="text-sm font-medium text-blue-600 dark:text-blue-400">Processing document...</p>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-2">
				<div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
					<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
				</div>
				<div>
					<p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
						Drop files here or <span class="text-blue-600 dark:text-blue-400">browse</span>
					</p>
					<p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Supports .txt and .pdf files</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Document list -->
	{#if docs.length > 0}
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Uploaded Documents</h3>
			{#each docs as doc (doc.id)}
				<div class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group">
					<div class="flex items-center gap-3 min-w-0">
						<div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
							<svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{doc.filename}</p>
							<div class="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
								<span>{formatSize(doc.fileSize)}</span>
								<span>{doc.chunkCount} chunks</span>
								<span class="px-1.5 py-0.5 rounded-full {statusColor(doc.status)}">{doc.status}</span>
							</div>
						</div>
					</div>
					<button
						onclick={() => ondelete(doc.id)}
						class="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
						title="Delete document"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
