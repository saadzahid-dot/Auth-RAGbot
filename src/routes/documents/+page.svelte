<script lang="ts">
	import DocumentUpload from '$lib/components/DocumentUpload.svelte';

	let { data } = $props<{ data: { session: unknown; documents: Doc[] } }>();

	type Doc = {
		id: string;
		filename: string;
		mimeType: string;
		fileSize: number;
		chunkCount: number;
		status: string;
		createdAt: string;
	};

	let docs = $state<Doc[]>(data.documents ?? []);
	let uploadError = $state<string | null>(null);

	async function handleUpload(file: File) {
		uploadError = null;
		const formData = new FormData();
		formData.append('file', file);

		try {
			const res = await fetch('/api/documents', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				const err = await res.json();
				uploadError = err.error || 'Upload failed';
				return;
			}

			const doc = await res.json();
			docs = [{ ...doc, createdAt: doc.createdAt ?? new Date().toISOString() }, ...docs];
		} catch {
			uploadError = 'Failed to upload document';
		}
	}

	async function handleDelete(id: string) {
		try {
			const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
			if (res.ok) {
				docs = docs.filter((d) => d.id !== id);
			}
		} catch {
			console.error('Failed to delete document');
		}
	}
</script>

<svelte:head>
	<title>Documents - Passly</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
	<div class="glass-card rounded-2xl overflow-hidden animate-slide-up">
		<!-- Header -->
		<div class="border-b border-gray-200 dark:border-gray-700/50 px-6 py-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/90">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/20">
					<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<div>
					<h1 class="text-xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Upload documents to give Pascal context for your conversations
					</p>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="p-6">
			{#if uploadError}
				<div class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm border border-red-200 dark:border-red-800 flex items-center justify-between">
					<span>{uploadError}</span>
					<button onclick={() => (uploadError = null)} class="text-red-400 hover:text-red-600">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/if}

			<DocumentUpload documents={docs} onupload={handleUpload} ondelete={handleDelete} />

			{#if docs.length === 0}
				<div class="text-center py-12">
					<div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
						</svg>
					</div>
					<p class="text-gray-500 dark:text-gray-400 text-sm">
						No documents uploaded yet. Upload text or PDF files to enhance your chat experience.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
