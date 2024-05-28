import { createOpenAI } from "@ai-sdk/openai";
import { zValidator } from "@hono/zod-validator";
import { convertToCoreMessages, streamText } from "ai";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { logger } from "hono/logger";
import { z } from "zod";
import { renderer } from "./renderer";

const app = new Hono();

app.use(logger());

const schema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
});

app.post("/api/chat", zValidator("json", schema), async (c) => {
  const { messages } = c.req.valid("json");

  const openai = createOpenAI({
    apiKey: env<{ OPENAI_API_KEY: string }>(c).OPENAI_API_KEY,
  });

  console.log(messages);

  const result = await streamText({
    model: openai("gpt-4-turbo"),
    messages: convertToCoreMessages(messages),
  });

  console.log(result);

  return result.toAIStreamResponse();
});

app.get("*", renderer, async (c) => {
  return c.render(<div id="root"></div>);
});

export default app;
