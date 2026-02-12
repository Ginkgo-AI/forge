import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  NeutralMessage,
  NeutralToolDef,
  ProviderModel,
  ProviderStreamEvent,
  StreamResult,
} from "../types.js";
import { toAnthropicTools } from "../tool-defs.js";

export class AnthropicProvider implements AIProvider {
  readonly providerId = "anthropic";
  readonly displayName = "Anthropic";
  readonly models: ProviderModel[] = [
    {
      id: "claude-sonnet-4-5-20250929",
      displayName: "Claude Sonnet 4.5",
      maxTokens: 8192,
    },
    {
      id: "claude-haiku-4-5-20251001",
      displayName: "Claude Haiku 4.5",
      maxTokens: 8192,
    },
  ];
  readonly defaultModel = "claude-sonnet-4-5-20250929";

  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
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
    const anthropicMessages = prepareAnthropicMessages(params.messages);
    const anthropicTools = toAnthropicTools(params.tools);

    const stream = this.client.messages.stream({
      model: params.model,
      max_tokens: params.maxTokens,
      system: params.systemPrompt,
      messages: anthropicMessages,
      tools: anthropicTools,
    });

    let resolveResult!: (value: StreamResult) => void;
    const resultPromise = new Promise<StreamResult>((resolve) => {
      resolveResult = resolve;
    });

    const self = this;

    async function* generateEvents(): AsyncGenerator<ProviderStreamEvent> {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield { type: "text_delta", text: event.delta.text };
        }
      }

      const finalMessage = await stream.finalMessage();
      const toolCalls: StreamResult["toolCalls"] = [];

      for (const block of finalMessage.content) {
        if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      resolveResult({
        toolCalls,
        stopReason:
          finalMessage.stop_reason === "tool_use" ? "tool_use" : "end_turn",
      });
    }

    return { events: generateEvents(), result: resultPromise };
  }

  async complete(params: {
    model: string;
    messages: NeutralMessage[];
    maxTokens: number;
    systemPrompt?: string;
  }): Promise<{ text: string }> {
    const anthropicMessages = prepareAnthropicMessages(params.messages);

    const response = await this.client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens,
      system: params.systemPrompt,
      messages: anthropicMessages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI");
    }

    return { text: textBlock.text };
  }
}

function prepareAnthropicMessages(
  messages: NeutralMessage[]
): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === "tool") {
      // Tool results must be batched into a single user message with tool_result blocks
      // Anthropic requires tool_result blocks inside a user message
      const blocks = Array.isArray(msg.content) ? msg.content : [];
      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = blocks
        .filter((b) => b.type === "tool_result")
        .map((b) => {
          if (b.type !== "tool_result") throw new Error("unreachable");
          return {
            type: "tool_result" as const,
            tool_use_id: b.toolCallId,
            content: b.content,
            is_error: b.isError,
          };
        });

      // Merge into the last user message if it exists, or create a new one
      const lastMsg = result[result.length - 1];
      if (lastMsg && lastMsg.role === "user" && Array.isArray(lastMsg.content)) {
        (lastMsg.content as Anthropic.ToolResultBlockParam[]).push(
          ...toolResultBlocks
        );
      } else {
        result.push({ role: "user", content: toolResultBlocks });
      }
      continue;
    }

    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      // Convert neutral content blocks to Anthropic format
      const anthropicBlocks: Anthropic.ContentBlockParam[] = msg.content.map(
        (block) => {
          if (block.type === "text") {
            return { type: "text" as const, text: block.text };
          }
          if (block.type === "tool_use") {
            return {
              type: "tool_use" as const,
              id: block.id,
              name: block.name,
              input: block.input,
            };
          }
          throw new Error(`Unexpected block type in assistant message: ${block.type}`);
        }
      );
      result.push({ role: "assistant", content: anthropicBlocks });
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
