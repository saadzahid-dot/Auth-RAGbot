import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { conversations } from '$lib/server/db/schema';
import { eq, desc, ilike } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	const search = url.searchParams.get('search');
	let query = db
		.select()
		.from(conversations)
		.where(eq(conversations.userId, session.user.id))
		.orderBy(desc(conversations.updatedAt))
		.limit(50);

	if (search) {
		query = db
			.select()
			.from(conversations)
			.where(eq(conversations.userId, session.user.id))
			.orderBy(desc(conversations.updatedAt))
			.limit(50);
	}

	const convos = await query;

	// Filter client-side for search (simpler than building dynamic where)
	const filtered = search
		? convos.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
		: convos;

	return Response.json(filtered);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { title, provider } = await request.json();

	const [convo] = await db
		.insert(conversations)
		.values({
			userId: session.user.id,
			title: title || 'New Chat',
			provider: provider || 'gemini'
		})
		.returning();

	return Response.json(convo, { status: 201 });
};
