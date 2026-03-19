import type { RequestHandler } from '@sveltejs/kit';
import { readFileSync } from 'fs';

let pkg: { name: string; version: string };
try {
	pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
} catch {
	pkg = { name: 'sveltekit-auth-app', version: '0.0.0' };
}

export const GET: RequestHandler = async () => {
	return Response.json({
		name: pkg.name,
		version: pkg.version,
		timestamp: new Date().toISOString()
	});
};
