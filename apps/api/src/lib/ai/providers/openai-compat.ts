import OpenAI from "openai";
import type {
  AIProvider,
  NeutralMessage,
  NeutralToolDef,
  ProviderModel,
  ProviderStreamEvent,
  StreamResult,
} from "../types.js";
import { toOpenAITools } from "../tool-defs.js";

export class OpenAICompatProvider implements AIProvider {
  readonly providerId: string;
  readonly displayName: string;
  readonly models: ProviderModel[];
  readonly defaultModel: string;

  private client: OpenAI;

  constructor(config: {
    providerName: string;
    apiKey: string;
    baseURL?: string;
    models: ProviderModel[];
  }) {
    this.providerId = "openai";
    this.displayName = config.providerName;
    this.models = config.models;
    this.defaultModel = config.models[0]?.id ?? "gpt-4o";
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  streamChat(params: {
    model: string;
    systemPrompt: string;
    messages: NeutralMessage[];
    tools: NeutralToolDef[];
    maxTokens: number;
  }): {
    events: AsyncGenerator<ProviderStreamEvent>;
    result: Promise<StreamResult>;
  } {
    const openaiMessages = toOpenAIMessages(params.systemPrompt, params.messages);
    const openaiTools = toOpenAITools(params.tools);

    let resolveResult!: (value: StreamResult) => void;
    const resultPromise = new Promise<StreamResult>((resolve) => {
      resolveResult = resolve;
    });

    const client = this.client;
    const model = params.model;
    const maxTokens = params.maxTokens;

    async function* generateEvents(): AsyncGenerator<ProviderStreamEvent> {
      const stream = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        messages: openaiMessages,
        tools: openaiTools,
        stream: true,
      });

      // Accumulate tool call fragments — OpenAI sends argument JSON in chunks
      const toolCallAccumulator = new Map<
        number,
        { id: string; name: string; arguments: string }
      >();

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        // Text content
        if (delta.content) {
          yield { type: "text_delta", text: delta.content };
        }

        // Tool call fragments
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const existing = toolCallAccumulator.get(tc.index);
            if (existing) {
              existing.arguments += tc.function?.arguments ?? "";
            } else {
              toolCallAccumulator.set(tc.index, {
                id: tc.id ?? "",
                name: tc.function?.name ?? "",
                arguments: tc.function?.arguments ?? "",
              });
            }
          }
        }

        // Finish reason
        const finishReason = chunk.choices[0]?.finish_reason;
        if (finishReason) {
          const toolCalls: StreamResult["toolCalls"] = [];

          for (const [, tc] of toolCallAccumulator) {
            let input: Record<string, unknown> = {};
            try {
              input = JSON.parse(tc.arguments);
            } catch {
              // Malformed arguments — pass empty
            }
            toolCalls.push({ id: tc.id, name: tc.name, input });
          }

          resolveResult({
            toolCalls,
            stopReason:
              finishReason === "tool_calls" ? "tool_use" : "end_turn",
          });
        }
      }
    }

    return { events: generateEvents(), result: resultPromise };
  }

  async complete(params: {
    model: string;
    messages: NeutralMessage[];
    maxTokens: number;
    systemPrompt?: string;
  }): Promise<{ text: string }> {
    const openaiMessages = toOpenAIMessages(
      params.systemPrompt,
      params.messages
    );

    const response = await this.client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens,
      messages: openaiMessages,
    });

    const text = response.choices[0]?.message?.content ?? "";
    return { text };
  }
}

function toOpenAIMessages(
  systemPrompt: string | undefined,
  messages: NeutralMessage[]
): OpenAI.ChatCompletionMessageParam[] {
  const result: OpenAI.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    result.push({ role: "system", content: systemPrompt });
  }

  for (const msg of messages) {
    if (msg.role === "tool") {
      // Each tool result becomes a separate {role: "tool"} message
      const blocks = Array.isArray(msg.content) ? msg.content : [];
      for (const block of blocks) {
        if (block.type === "tool_result") {
          result.push({
            role: "tool",
            tool_call_id: block.toolCallId,
            content: block.content,
          });
        }
      }
      continue;
    }

    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      // Assistant message with content blocks (text + tool_use)
      let textContent = "";
      const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = [];

      for (const block of msg.content) {
        if (block.type === "text") {
          textContent += block.text;
        } else if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            type: "function",
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input),
            },
          });
        }
      }

      const assistantMsg: OpenAI.ChatCompletionAssistantMessageParam = {
        role: "assistant",
        content: textContent || null,
      };
      if (toolCalls.length > 0) {
        assistantMsg.tool_calls = toolCalls;
      }
      result.push(assistantMsg);
      continue;
    }

    // Simple text messages
    result.push({
      role: msg.role as "user" | "assistant",
      content: typeof msg.content === "string" ? msg.content : "",
    });
  }

  return result;
}
