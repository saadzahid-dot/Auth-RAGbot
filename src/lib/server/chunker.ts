const DEFAULT_SEPARATORS = ['\n\n', '\n', '. ', ' ', ''];

export function chunkText(
	text: string,
	chunkSize = 250,
	overlap = 50,
	separators = DEFAULT_SEPARATORS
): string[] {
	const cleaned = text.replace(/\r\n/g, '\n').trim();
	if (!cleaned) return [];

	return recursiveSplit(cleaned, chunkSize, overlap, separators);
}

function recursiveSplit(
	text: string,
	chunkSize: number,
	overlap: number,
	separators: string[]
): string[] {
	if (text.length <= chunkSize) {
		return text.trim() ? [text.trim()] : [];
	}

	// Find the best separator that exists in the text
	let sep = '';
	let remainingSeparators = separators;
	for (let i = 0; i < separators.length; i++) {
		if (separators[i] === '' || text.includes(separators[i])) {
			sep = separators[i];
			remainingSeparators = separators.slice(i + 1);
			break;
		}
	}

	// Split by the chosen separator
	const parts = sep ? text.split(sep) : [...text];
	const chunks: string[] = [];
	let current = '';

	for (const part of parts) {
		const candidate = current ? current + sep + part : part;

		if (candidate.length <= chunkSize) {
			current = candidate;
		} else {
			// Push current chunk if it has content
			if (current.trim()) {
				chunks.push(current.trim());
			}

			// If this single part exceeds chunkSize, recursively split it
			if (part.length > chunkSize) {
				const subChunks = recursiveSplit(part, chunkSize, overlap, remainingSeparators);
				chunks.push(...subChunks);
				current = '';
			} else {
				// Start new chunk with overlap from previous
				if (overlap > 0 && current) {
					const overlapText = current.slice(-overlap);
					current = overlapText + sep + part;
				} else {
					current = part;
				}
			}
		}
	}

	// Don't forget the last chunk
	if (current.trim()) {
		chunks.push(current.trim());
	}

	return chunks;
}
