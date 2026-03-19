import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { checkEmbeddingHealth } from '$lib/server/embedding';

export const GET: RequestHandler = async () => {
	let dbStatus = 'ok';
	try {
		await db.execute(sql`SELECT 1`);
	} catch {
		dbStatus = 'error';
	}

	const embeddingStatus = (await checkEmbeddingHealth()) ? 'ok' : 'error';

	const overall = dbStatus === 'ok' && embeddingStatus === 'ok' ? 'ok' : 'degraded';

	return Response.json({
		status: overall,
		timestamp: new Date().toISOString(),
		services: {
			database: dbStatus,
			embedding: embeddingStatus
		}
	});
};
