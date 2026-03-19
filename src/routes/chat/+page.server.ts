import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { conversations } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();

	let userConversations: Array<{
		id: string;
		title: string;
		provider: string;
		updatedAt: Date | null;
		createdAt: Date | null;
	}> = [];

	if (session?.user?.id) {
		userConversations = await db
			.select({
				id: conversations.id,
				title: conversations.title,
				provider: conversations.provider,
				updatedAt: conversations.updatedAt,
				createdAt: conversations.createdAt
			})
			.from(conversations)
			.where(eq(conversations.userId, session.user.id))
			.orderBy(desc(conversations.updatedAt))
			.limit(50);
	}

	return {
		session,
		conversations: userConversations.map((c) => ({
			...c,
			updatedAt: c.updatedAt?.toISOString() ?? new Date().toISOString(),
			createdAt: c.createdAt?.toISOString() ?? new Date().toISOString()
		}))
	};
};
