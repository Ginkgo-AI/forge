// Provider-agnostic AI types

export type NeutralRole = "user" | "assistant" | "tool";

export type NeutralTextBlock = {
  type: "text";
  text: string;
};

export type NeutralToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type NeutralToolResultBlock = {
  type: "tool_result";
  toolCallId: string;
  content: string;
  isError?: boolean;
};

export type NeutralContentBlock =
  | NeutralTextBlock
  | NeutralToolUseBlock
  | NeutralToolResultBlock;

export type NeutralMessage = {
  role: NeutralRole;
  content: string | NeutralContentBlock[];
};

export type NeutralToolDef = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
};

export type ProviderStreamEvent = {
  type: "text_delta";
  text: string;
};

export type StreamResult = {
  toolCalls: Array<{
    id: string;
    name: string;
    input: Record<string, unknown>;
  }>;
  stopReason: "end_turn" | "tool_use";
};

export type ProviderModel = {
  id: string;
  displayName: string;
  maxTokens: number;
};

export type ProviderInfo = {
  providerId: string;
  displayName: string;
  models: ProviderModel[];
  defaultModel: string;
  isDefault: boolean;
};

export interface AIProvider {
  providerId: string;
  displayName: string;
  models: ProviderModel[];
  defaultModel: string;

  streamChat(params: {
    model: string;
    systemPrompt: string;
    messages: NeutralMessage[];
    tools: NeutralToolDef[];
    maxTokens: number;
  }): {
    events: AsyncGenerator<ProviderStreamEvent>;
    result: Promise<StreamResult>;
  };

  complete(params: {
    model: string;
    messages: NeutralMessage[];
    maxTokens: number;
    systemPrompt?: string;
  }): Promise<{ text: string }>;
}
