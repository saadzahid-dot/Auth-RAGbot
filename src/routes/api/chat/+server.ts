import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { env } from "$env/dynamic/private";
import type { RequestHandler } from "./$types";
import { retrieveRelevantChunks, retrieveChunksByFilename, buildContextPrompt } from "$lib/server/rag";

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, provider = "gemini", attachedFileName = null } = await request.json();

  let model;

  if (provider === "gemini") {
    const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey)
      return new Response("Gemini API key not configured", { status: 503 });
    const google = createGoogleGenerativeAI({ apiKey });
    model = google("gemini-2.5-flash");
  } else {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey)
      return new Response("OpenAI API key not configured", { status: 503 });
    const openai = createOpenAI({ apiKey });
    model = openai("gpt-5-mini-2025-08-07");
  }

  // RAG: Retrieve relevant context from uploaded documents
  const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === "user");
  let ragContext = "";
  let citations: Array<{
    documentId: string;
    filename: string;
    chunkId: string;
    chunkIndex: number;
    snippet: string;
    similarity: number;
  }> = [];

  if (lastUserMessage) {
    try {
      let relevantChunks;
      if (attachedFileName) {
        // File is attached — retrieve from that specific document (no threshold, user explicitly attached it)
        relevantChunks = await retrieveChunksByFilename(lastUserMessage.content, attachedFileName, 5);
      } else {
        relevantChunks = await retrieveRelevantChunks(lastUserMessage.content, 5, 0.3);
      }
      if (relevantChunks.length > 0) {
        ragContext = buildContextPrompt(relevantChunks);
        citations = relevantChunks.map((c) => ({
          documentId: c.documentId,
          filename: c.filename,
          chunkId: c.id,
          chunkIndex: c.chunkIndex,
          snippet: c.content.slice(0, 200),
          similarity: Number(c.similarity)
        }));
      }
    } catch (err) {
      console.error("RAG retrieval error (continuing without context):", err);
    }
  }

  const systemPrompt = `You are a helpful, friendly AI assistant. Follow these formatting rules strictly:

## Response Formatting
- Use proper **Markdown** for all responses.
- Keep responses concise, well-structured, and easy to read.

## Code
- EVERY code block MUST have a language identifier. This is a STRICT requirement with NO exceptions.
- The opening fence MUST always be \`\`\`language — for example: \`\`\`python, \`\`\`javascript, \`\`\`java, \`\`\`cpp, \`\`\`c, \`\`\`html, \`\`\`css, \`\`\`sql, \`\`\`bash, \`\`\`typescript, \`\`\`rust, \`\`\`go, \`\`\`ruby, \`\`\`php, \`\`\`swift, \`\`\`kotlin, \`\`\`yaml, \`\`\`json, \`\`\`xml, \`\`\`markdown, etc.
- NEVER write a bare \`\`\` without a language. If you are unsure of the language, use \`\`\`plaintext.
- For shell/terminal commands, always use \`\`\`bash.
- For configuration files, use the appropriate language: \`\`\`yaml, \`\`\`json, \`\`\`toml, \`\`\`ini, etc.
- For output/logs with no specific language, use \`\`\`bash.
- When the user asks for code in a specific language, write the code in that exact language.
- Use inline \`code\` for short references like variable names, commands, or file paths.
- Add brief comments in code when helpful.
- IMPORTANT: Keep ALL lines in code blocks under 60 characters wide. Break long lines using the language's line continuation or by splitting into multiple shorter lines. This is critical for readability in the chat UI.
- For long strings, URLs, or expressions in code, split them across multiple lines.
- Never put long single-line comments in code — wrap them to stay under 60 chars.

## Tables
- When presenting tabular or comparative data, always use Markdown tables with proper headers and alignment.
- After every table, always include a short summary paragraph that highlights key takeaways or explains the data shown in the table. Never end a response immediately after a table.
- Example format:
  | Column 1 | Column 2 | Column 3 |
  |----------|----------|----------|
  | data     | data     | data     |

  As shown above, [brief explanation of the data].

## Lists & Structure
- Use bullet points or numbered lists for steps, options, or enumerations.
- Use headings (##, ###) to organize longer responses into sections.
- Use **bold** for emphasis and key terms.

## General
- Do not wrap entire responses in a code block.
- Respond directly without unnecessary preamble.${ragContext}`;

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
  });

  // Create a TransformStream to append citations after the text stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const textStream = result.toTextStreamResponse();
      const reader = textStream.body!.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }

      // Append citations marker at the end of the stream
      if (citations.length > 0) {
        await writer.write(
          encoder.encode(`\n\n<!--CITATIONS:${JSON.stringify(citations)}-->`)
        );
      }
    } catch (err) {
      console.error("Stream error:", err);
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
};
