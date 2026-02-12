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
  triggerAgent: (id: string) =>
    request(`/agents/${id}/run`, { method: "POST" }),

  // AI
  chat: (data: { message: string; context?: Record<string, string>; conversationId?: string }) =>
    request("/ai/chat", { method: "POST", body: JSON.stringify(data) }),
  generateBoard: (data: { description: string; workspaceId: string }) =>
    request("/ai/generate-board", { method: "POST", body: JSON.stringify(data) }),
  extractItems: (data: { text: string; boardId: string }) =>
    request("/ai/extract-items", { method: "POST", body: JSON.stringify(data) }),
};
