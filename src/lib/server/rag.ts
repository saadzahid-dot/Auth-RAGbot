import { db } from './db';
import { getEmbedding } from './embedding';
import { sql } from 'drizzle-orm';

export type RetrievedChunk = {
	id: string;
	content: string;
	documentId: string;
	filename: string;
	chunkIndex: number;
	similarity: number;
	metadata: unknown;
};

export async function retrieveRelevantChunks(
	query: string,
	userId: string,
	topK = 5,
	threshold = 0.3
): Promise<RetrievedChunk[]> {
	const queryEmbedding = await getEmbedding(query);
	const vectorStr = `[${queryEmbedding.join(',')}]`;

	const results = await db.execute<Record<string, unknown>>(sql`
		SELECT
			c.id,
			c.content,
			c.document_id AS "documentId",
			c.chunk_index AS "chunkIndex",
			c.metadata,
			d.filename,
			1 - (c.embedding <=> ${vectorStr}::vector) AS similarity
		FROM chunks c
		JOIN documents d ON d.id = c.document_id
		WHERE d.status = 'ready' AND d.user_id = ${userId}
		ORDER BY c.embedding <=> ${vectorStr}::vector
		LIMIT ${topK}
	`);

	// db.execute returns RowList (array-like) with postgres-js driver
	const rows = Array.from(results) as unknown as RetrievedChunk[];
	return rows.filter((r) => Number(r.similarity) >= threshold);
}

export async function retrieveChunksByFilename(
	query: string,
	filename: string,
	userId: string,
	topK = 5
): Promise<RetrievedChunk[]> {
	const queryEmbedding = await getEmbedding(query);
	const vectorStr = `[${queryEmbedding.join(',')}]`;

	const results = await db.execute<Record<string, unknown>>(sql`
		SELECT
			c.id,
			c.content,
			c.document_id AS "documentId",
			c.chunk_index AS "chunkIndex",
			c.metadata,
			d.filename,
			1 - (c.embedding <=> ${vectorStr}::vector) AS similarity
		FROM chunks c
		JOIN documents d ON d.id = c.document_id
		WHERE d.status = 'ready' AND d.filename = ${filename} AND d.user_id = ${userId}
		ORDER BY c.embedding <=> ${vectorStr}::vector
		LIMIT ${topK}
	`);

	return Array.from(results) as unknown as RetrievedChunk[];
}

export function buildContextPrompt(chunks: RetrievedChunk[]): string {
	if (chunks.length === 0) return '';

	const contextBlocks = chunks
		.map(
			(c, i) =>
				`[Source ${i + 1}: ${c.filename}, Chunk ${c.chunkIndex + 1}]\n${c.content}`
		)
		.join('\n\n---\n\n');

	return `\n\n## Retrieved Knowledge Base Context\nThe following excerpts from uploaded documents may be relevant to the user's question. Use them to ground your answer when applicable, and cite sources using [Source N] notation.\n\n---\n\n${contextBlocks}\n\n---\n\nWhen you use information from the above sources, include the citation like [Source 1], [Source 2], etc.`;
}
