import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { conversations, messages } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	const [convo] = await db
		.select()
		.from(conversations)
		.where(and(eq(conversations.id, params.id), eq(conversations.userId, session.user.id)));

	if (!convo) {
		return Response.json({ error: 'Conversation not found' }, { status: 404 });
	}

	const msgs = await db
		.select()
		.from(messages)
		.where(eq(messages.conversationId, params.id))
		.orderBy(asc(messages.createdAt));

	return Response.json({ conversation: convo, messages: msgs });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	const [convo] = await db
		.select()
		.from(conversations)
		.where(and(eq(conversations.id, params.id), eq(conversations.userId, session.user.id)));

	if (!convo) {
		return Response.json({ error: 'Conversation not found' }, { status: 404 });
	}

	await db.delete(conversations).where(eq(conversations.id, params.id));

	return Response.json({ success: true });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { title } = await request.json();

	const [convo] = await db
		.select()
		.from(conversations)
		.where(and(eq(conversations.id, params.id), eq(conversations.userId, session.user.id)));

	if (!convo) {
		return Response.json({ error: 'Conversation not found' }, { status: 404 });
	}

	const [updated] = await db
		.update(conversations)
		.set({ title, updatedAt: new Date() })
		.where(eq(conversations.id, params.id))
		.returning();

	return Response.json(updated);
};
