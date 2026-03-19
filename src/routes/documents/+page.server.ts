import type { ServerLoadEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load = async (event: ServerLoadEvent) => {
	const session = await event.locals.auth();

	let userDocuments: Array<{
		id: string;
		filename: string;
		mimeType: string;
		fileSize: number;
		chunkCount: number;
		status: string;
		createdAt: Date | null;
	}> = [];

	if (session?.user?.id) {
		userDocuments = await db
			.select()
			.from(documents)
			.where(eq(documents.userId, session.user.id))
			.orderBy(desc(documents.createdAt));
	}

	return {
		session,
		documents: userDocuments.map((d) => ({
			...d,
			createdAt: d.createdAt?.toISOString() ?? new Date().toISOString()
		}))
	};
};
