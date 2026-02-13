import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, CheckCircle, Wrench, AlertCircle, ChevronDown } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api.ts";
import type { ChatSSEEvent, ProviderInfo } from "../../lib/api.ts";
import { useWorkspaceStore } from "../../stores/workspace.ts";
import { useAIPreferencesStore } from "../../stores/ai.ts";

type ToolCall = {
  toolCallId: string;
  toolName: string;
  status: "running" | "done" | "error";
  result?: unknown;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
};

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  list_boards: "Listing boards",
  get_board: "Getting board details",
  create_board: "Creating board",
  add_column: "Adding column",
  add_group: "Adding group",
  list_items: "Listing items",
  get_item: "Getting item details",
  create_item: "Creating item",
  update_item: "Updating item",
  delete_item: "Deleting item",
  add_item_update: "Adding comment",
  list_workspace_members: "Looking up members",
};

type ModelOption = {
  providerId: string;
  modelId: string;
  displayName: string;
  isDefault: boolean;
};

function flattenProviderModels(providers: ProviderInfo[]): ModelOption[] {
  const options: ModelOption[] = [];
  for (const p of providers) {
    for (const m of p.models) {
      options.push({
        providerId: p.providerId,
        modelId: m.id,
        displayName: `${m.displayName}`,
        isDefault: p.isDefault && m.id === p.defaultModel,
      });
    }
  }
  return options;
}

export function AIChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Forge AI. I can help you manage your boards, create items, analyze data, and more. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [selectedModel, setSelectedModel] = useState<ModelOption | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const workspaceId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const currentBoardId = useWorkspaceStore((s) => s.currentBoardId);
  const { preferredProviderId, preferredModelId, setPreferredModel } = useAIPreferencesStore();

  const { data: providersData } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => api.getProviders(),
    staleTime: 5 * 60 * 1000,
  });

  const modelOptions = providersData
    ? flattenProviderModels(providersData.data)
    : [];

  // Set default selection once providers load — use store preference if available
  useEffect(() => {
    if (modelOptions.length > 0 && !selectedModel) {
      const preferred = preferredProviderId && preferredModelId
        ? modelOptions.find((o) => o.providerId === preferredProviderId && o.modelId === preferredModelId)
        : null;
      const defaultOption = preferred || modelOptions.find((o) => o.isDefault) || modelOptions[0];
      setSelectedModel(defaultOption);
    }
  }, [modelOptions, selectedModel, preferredProviderId, preferredModelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !workspaceId) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      toolCalls: [],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    const messageText = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      await api.chatStream(
        {
          message: messageText,
          workspaceId,
          conversationId,
          boardId: currentBoardId ?? undefined,
          providerId: selectedModel?.providerId,
          model: selectedModel?.modelId,
        },
        (event: ChatSSEEvent) => {
          switch (event.type) {
            case "text_delta":
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  last.content += event.content;
                }
                return updated;
              });
              break;

            case "tool_call_start":
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  last.toolCalls = [
                    ...(last.toolCalls ?? []),
                    {
                      toolCallId: event.toolCallId,
                      toolName: event.toolName,
                      status: "running",
                    },
                  ];
                }
                return updated;
              });
              break;

            case "tool_call_result":
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant" && last.toolCalls) {
                  const tc = last.toolCalls.find(
                    (t) => t.toolCallId === event.toolCallId
                  );
                  if (tc) {
                    tc.status = "done";
                    tc.result = event.result;
                  }
                }
                return updated;
              });
              break;

            case "done":
              setConversationId(event.conversationId);
              // Invalidate caches so UI reflects AI changes
              queryClient.invalidateQueries({ queryKey: ["boards"] });
              queryClient.invalidateQueries({ queryKey: ["items"] });
              break;

            case "error":
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  last.content += `\n\nError: ${event.error}`;
                }
                return updated;
              });
              break;
          }
        }
      );
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant") {
          last.content =
            err instanceof Error
              ? `Sorry, something went wrong: ${err.message}`
              : "Sorry, something went wrong. Please try again.";
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-forge-surface">
      {/* Header */}
      <div className="h-12 flex items-center gap-2 px-4 border-b border-forge-border shrink-0">
        <Sparkles size={16} className="text-forge-accent" />
        <span className="text-sm font-medium">Forge AI</span>
        {modelOptions.length > 1 && (
          <div className="relative ml-auto">
            <select
              value={selectedModel ? `${selectedModel.providerId}:${selectedModel.modelId}` : ""}
              onChange={(e) => {
                const option = modelOptions.find(
                  (o) => `${o.providerId}:${o.modelId}` === e.target.value
                );
                if (option) {
                  setSelectedModel(option);
                  setPreferredModel(option.providerId, option.modelId);
                }
              }}
              className="appearance-none bg-forge-accent/15 border border-forge-accent/40 rounded-md px-3 py-1 pr-7 text-xs font-medium text-forge-accent cursor-pointer focus:outline-none focus:border-forge-accent hover:bg-forge-accent/25 transition-colors"
            >
              {modelOptions.map((o) => (
                <option
                  key={`${o.providerId}:${o.modelId}`}
                  value={`${o.providerId}:${o.modelId}`}
                >
                  {o.displayName}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-forge-accent"
            />
          </div>
        )}
        {modelOptions.length <= 1 && currentBoardId && (
          <span className="text-xs text-forge-text-muted ml-auto">
            Board context active
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-forge-accent text-white"
                    : "bg-forge-surface-hover text-forge-text"
                }`}
              >
                {msg.content}
                {msg.role === "assistant" && isLoading && i === messages.length - 1 && !msg.content && (
                  <Loader2 size={14} className="animate-spin inline-block" />
                )}
              </div>
            </div>

            {/* Tool call cards */}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div className="mt-2 space-y-1.5 ml-0 max-w-[85%]">
                {msg.toolCalls.map((tc) => (
                  <div
                    key={tc.toolCallId}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-forge-bg border border-forge-border text-xs"
                  >
                    {tc.status === "running" ? (
                      <Loader2
                        size={12}
                        className="animate-spin text-forge-accent shrink-0"
                      />
                    ) : tc.status === "error" ? (
                      <AlertCircle size={12} className="text-red-500 shrink-0" />
                    ) : (
                      <CheckCircle
                        size={12}
                        className="text-green-500 shrink-0"
                      />
                    )}
                    <Wrench size={10} className="text-forge-text-muted shrink-0" />
                    <span className="text-forge-text-muted truncate">
                      {TOOL_DISPLAY_NAMES[tc.toolName] || tc.toolName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-forge-border">
        {!workspaceId && (
          <p className="text-xs text-forge-text-muted mb-2">
            Select a workspace to start chatting with Forge AI.
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={
              workspaceId
                ? "Ask Forge AI anything..."
                : "Select a workspace first..."
            }
            disabled={!workspaceId || isLoading}
            className="flex-1 bg-forge-bg border border-forge-border rounded-md px-3 py-2 text-sm text-forge-text placeholder:text-forge-text-muted focus:outline-none focus:border-forge-accent disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !workspaceId}
            className="p-2 rounded-md bg-forge-accent hover:bg-forge-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
