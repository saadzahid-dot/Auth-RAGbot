import { env } from '$env/dynamic/private';

function getBaseUrl(): string {
	return env.EMBEDDING_API_URL || 'http://localhost:8000';
}

export async function getEmbedding(text: string): Promise<number[]> {
	const res = await fetch(`${getBaseUrl()}/embed`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ text })
	});
	if (!res.ok) throw new Error(`Embedding service error: ${res.status}`);
	const data = await res.json();
	return data.embedding;
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
	const res = await fetch(`${getBaseUrl()}/embed-batch`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ texts })
	});
	if (!res.ok) throw new Error(`Embedding service error: ${res.status}`);
	const data = await res.json();
	return data.embeddings;
}

export async function checkEmbeddingHealth(): Promise<boolean> {
	try {
		const res = await fetch(`${getBaseUrl()}/health`, { signal: AbortSignal.timeout(3000) });
		return res.ok;
	} catch {
		return false;
	}
}
