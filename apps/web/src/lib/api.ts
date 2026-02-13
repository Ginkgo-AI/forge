const API_BASE = "/api/v1";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "Request failed");
  }

  return res.json();
}

export type ChatSSEEvent =
  | { type: "text_delta"; content: string }
  | { type: "tool_call_start"; toolName: string; toolCallId: string }
  | { type: "tool_call_result"; toolCallId: string; toolName: string; result: unknown }
  | { type: "done"; conversationId: string; toolCalls: unknown[] }
  | { type: "error"; error: string };

async function chatStream(
  data: {
    message: string;
    workspaceId: string;
    conversationId?: string;
    boardId?: string;
    itemId?: string;
    providerId?: string;
    model?: string;
  },
  onEvent: (event: ChatSSEEvent) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "Request failed");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE lines
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data:")) {
        const jsonStr = line.slice(5).trim();
        if (jsonStr) {
          try {
            const event = JSON.parse(jsonStr) as ChatSSEEvent;
            onEvent(event);
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    const lines = buffer.split("\n");
    for (const line of lines) {
      if (line.startsWith("data:")) {
        const jsonStr = line.slice(5).trim();
        if (jsonStr) {
          try {
            const event = JSON.parse(jsonStr) as ChatSSEEvent;
            onEvent(event);
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  }
}

export const api = {
  // Workspaces
  listWorkspaces: () => request("/workspaces"),
  createWorkspace: (data: { name: string; description?: string }) =>
    request("/workspaces", { method: "POST", body: JSON.stringify(data) }),

  // Boards
  listBoards: (workspaceId: string) =>
    request(`/boards?workspaceId=${workspaceId}`),
  getBoard: (id: string) => request(`/boards/${id}`),
  createBoard: (data: { name: string; workspaceId: string; description?: string }) =>
    request("/boards", { method: "POST", body: JSON.stringify(data) }),
  deleteBoard: (id: string) =>
    request(`/boards/${id}`, { method: "DELETE" }),

  // Members
  listMembers: (workspaceId: string) =>
    request(`/workspaces/${workspaceId}/members`),

  // Items
  listItems: (boardId: string) => request(`/items?boardId=${boardId}`),
  getItem: (id: string) => request(`/items/${id}`),
  createItem: (data: { boardId: string; groupId: string; name: string }) =>
    request("/items", { method: "POST", body: JSON.stringify(data) }),
  updateItem: (id: string, data: Record<string, unknown>) =>
    request(`/items/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteItem: (id: string) =>
    request(`/items/${id}`, { method: "DELETE" }),
  addItemUpdate: (itemId: string, data: { body: string }) =>
    request(`/items/${itemId}/updates`, { method: "POST", body: JSON.stringify(data) }),

  // Agents
  listAgents: (workspaceId: string) =>
    request(`/agents?workspaceId=${workspaceId}`),
  getAgent: (id: string) => request(`/agents/${id}`),
  createAgent: (data: {
    workspaceId: string;
    name: string;
    description?: string;
    systemPrompt: string;
    tools: string[];
    triggers: Array<{ type: string; config: Record<string, unknown> }>;
    guardrails?: {
      requireApproval: boolean;
      maxActionsPerRun: number;
      allowedBoardIds?: string[];
      blockedTools?: string[];
    };
  }) => request("/agents", { method: "POST", body: JSON.stringify(data) }),
  updateAgent: (id: string, data: Record<string, unknown>) =>
    request(`/agents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAgent: (id: string) =>
    request(`/agents/${id}`, { method: "DELETE" }),
  triggerAgent: (id: string, prompt?: string) =>
    request(`/agents/${id}/run`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  // Automations
  listAutomations: (boardId: string) =>
    request(`/automations?boardId=${boardId}`),
  getAutomation: (id: string) => request(`/automations/${id}`),
  createAutomation: (data: {
    boardId: string;
    name: string;
    description?: string;
    trigger: { type: string; config: Record<string, unknown> };
    conditions?: Array<{ columnId: string; operator: string; value: unknown }>;
    actions: Array<{ type: string; config: Record<string, unknown> }>;
  }) => request("/automations", { method: "POST", body: JSON.stringify(data) }),
  updateAutomation: (id: string, data: Record<string, unknown>) =>
    request(`/automations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAutomation: (id: string) =>
    request(`/automations/${id}`, { method: "DELETE" }),
  triggerAutomation: (id: string) =>
    request(`/automations/${id}/trigger`, { method: "POST" }),

  // Dashboard
  getDashboardStats: (workspaceId: string) =>
    request(`/dashboard/stats?workspaceId=${workspaceId}`),
  getActivityFeed: (workspaceId: string, limit = 20) =>
    request(`/dashboard/activity?workspaceId=${workspaceId}&limit=${limit}`),
  getActivityTimeline: (workspaceId: string, days = 14) =>
    request(`/dashboard/timeline?workspaceId=${workspaceId}&days=${days}`),
  getBoardBreakdown: (workspaceId: string) =>
    request(`/dashboard/board-breakdown?workspaceId=${workspaceId}`),
  generateReport: (data: { workspaceId: string; providerId?: string; model?: string }) =>
    request("/dashboard/report", { method: "POST", body: JSON.stringify(data) }),

  // AI
  chatStream,
  chat: (data: { message: string; context?: Record<string, string>; conversationId?: string }) =>
    request("/ai/chat", { method: "POST", body: JSON.stringify(data) }),
  generateBoard: (data: { description: string; workspaceId: string; providerId?: string; model?: string }) =>
    request("/ai/generate-board", { method: "POST", body: JSON.stringify(data) }),
  extractItems: (data: { text: string; boardId: string; providerId?: string; model?: string }) =>
    request("/ai/extract-items", { method: "POST", body: JSON.stringify(data) }),
  getProviders: () => request<{ data: ProviderInfo[] }>("/ai/providers"),

  // Settings
  getWorkspaceSettings: (workspaceId: string) =>
    request(`/settings/workspace/${workspaceId}`),
  updateWorkspaceSettings: (workspaceId: string, data: { name?: string; description?: string }) =>
    request(`/settings/workspace/${workspaceId}`, { method: "PATCH", body: JSON.stringify(data) }),
  getAISettings: () => request("/settings/ai"),

  // User profile
  updateProfile: (data: { name?: string; avatarUrl?: string | null }) =>
    request("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request("/users/me/password", { method: "POST", body: JSON.stringify(data) }),

  // Documents
  listDocuments: (workspaceId: string) =>
    request(`/documents?workspaceId=${workspaceId}`),
  getDocument: (id: string) => request(`/documents/${id}`),
  createDocument: (data: { workspaceId: string; title: string; content?: string; parentDocId?: string }) =>
    request("/documents", { method: "POST", body: JSON.stringify(data) }),
  updateDocument: (id: string, data: { title?: string; content?: string }) =>
    request(`/documents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDocument: (id: string) =>
    request(`/documents/${id}`, { method: "DELETE" }),
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
