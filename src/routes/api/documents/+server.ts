import { db } from '$lib/server/db';
import { documents, chunks } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { chunkText } from '$lib/server/chunker';
import { getEmbeddings } from '$lib/server/embedding';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	const docs = await db
		.select()
		.from(documents)
		.where(eq(documents.userId, session.user.id))
		.orderBy(desc(documents.createdAt));

	return Response.json(docs);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file) {
		return Response.json({ error: 'No file provided' }, { status: 400 });
	}

	const allowedTypes = ['text/plain', 'application/pdf'];
	if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
		return Response.json({ error: 'Only .txt and .pdf files are supported' }, { status: 400 });
	}

	let textContent: string;

	if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
		// PDF support (pdf-parse v2.x class-based API)
		try {
			const { PDFParse } = await import('pdf-parse');
			const buffer = Buffer.from(await file.arrayBuffer());
			const parser = new PDFParse({ data: buffer });
			const result = await parser.getText();
			textContent = result.text;
			await parser.destroy();
		} catch (e) {
			console.error('PDF parse error:', e);
			return Response.json({ error: 'Failed to parse PDF. Ensure pdf-parse is installed.' }, { status: 500 });
		}
	} else {
		textContent = await file.text();
	}

	if (!textContent.trim()) {
		return Response.json({ error: 'File is empty' }, { status: 400 });
	}

	// Create document record
	const [doc] = await db
		.insert(documents)
		.values({
			userId: session.user.id,
			filename: file.name,
			mimeType: file.type || 'text/plain',
			fileSize: file.size,
			status: 'processing'
		})
		.returning();

	try {
		// Chunk the text
		const textChunks = chunkText(textContent);

		// Generate embeddings for all chunks
		const embeddings = await getEmbeddings(textChunks);

		// Insert chunks with embeddings
		for (let i = 0; i < textChunks.length; i++) {
			await db.insert(chunks).values({
				documentId: doc.id,
				content: textChunks[i],
				chunkIndex: i,
				embedding: embeddings[i],
				metadata: { charStart: i * 450, charEnd: Math.min((i + 1) * 500, textContent.length) }
			});
		}

		// Update document status
		await db
			.update(documents)
			.set({ status: 'ready', chunkCount: textChunks.length })
			.where(eq(documents.id, doc.id));

		const [updatedDoc] = await db
			.select()
			.from(documents)
			.where(eq(documents.id, doc.id));

		return Response.json(updatedDoc, { status: 201 });
	} catch (error) {
		await db
			.update(documents)
			.set({ status: 'error' })
			.where(eq(documents.id, doc.id));

		console.error('Document ingestion error:', error);
		return Response.json({ error: 'Failed to process document' }, { status: 500 });
	}
};
