// ── Core Entity Types ──

export type Workspace = {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type Board = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  columns: Column[];
  groups: Group[];
  createdAt: string;
  updatedAt: string;
};

export type Column = {
  id: string;
  boardId: string;
  title: string;
  type: ColumnType;
  position: number;
  config: ColumnConfig;
  aiPrompt?: string;
};

export type ColumnType =
  | "text"
  | "number"
  | "status"
  | "person"
  | "date"
  | "timeline"
  | "checkbox"
  | "link"
  | "file"
  | "formula"
  | "ai_generated"
  | "dropdown"
  | "rating"
  | "tags"
  | "email"
  | "phone"
  | "location"
  | "dependency";

export type ColumnConfig = {
  labels?: Record<string, { label: string; color: string }>;
  options?: string[];
  unit?: string;
  precision?: number;
  formula?: string;
  aiSourceColumns?: string[];
  [key: string]: unknown;
};

export type Group = {
  id: string;
  boardId: string;
  title: string;
  color: string;
  position: number;
  collapsed: boolean;
};

export type Item = {
  id: string;
  boardId: string;
  groupId: string;
  parentItemId?: string;
  name: string;
  position: number;
  columnValues: Record<string, unknown>;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
};

export type ItemUpdate = {
  id: string;
  itemId: string;
  authorId?: string;
  body: string;
  parentUpdateId?: string;
  createdAt: string;
  updatedAt: string;
};

// ── User & Team ──

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
};

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  user?: User;
  joinedAt: string;
};

export type MemberRole = "owner" | "admin" | "member" | "viewer";

// ── Board Views ──

export type BoardView = {
  id: string;
  boardId: string;
  name: string;
  type: ViewType;
  config: ViewConfig;
  position: number;
};

export type ViewType =
  | "table"
  | "kanban"
  | "gantt"
  | "timeline"
  | "calendar"
  | "chart"
  | "cards";

export type ViewConfig = {
  filters?: ViewFilter[];
  sortBy?: ViewSort[];
  groupBy?: string;
  hiddenColumns?: string[];
  [key: string]: unknown;
};

export type ViewFilter = {
  columnId: string;
  operator: string;
  value: unknown;
};

export type ViewSort = {
  columnId: string;
  direction: "asc" | "desc";
};

// ── AI & Agents ──

export type Agent = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  systemPrompt: string;
  tools: string[];
  triggers: AgentTrigger[];
  guardrails: AgentGuardrails;
  status: "active" | "paused" | "disabled";
  createdAt: string;
  updatedAt: string;
};

export type AgentTrigger = {
  type: "schedule" | "event" | "manual";
  config: Record<string, unknown>;
};

export type AgentGuardrails = {
  requireApproval: boolean;
  maxActionsPerRun: number;
  allowedBoardIds?: string[];
  blockedTools?: string[];
};

export type AgentRun = {
  id: string;
  agentId: string;
  status: "queued" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
  toolCalls: ToolCall[];
  pendingActions: PendingAction[];
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
};

export type ToolCall = {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  timestamp: string;
};

export type PendingAction = {
  id: string;
  description: string;
  toolCall: ToolCall;
  status: "pending" | "approved" | "rejected";
};

// ── Automations ──

export type Automation = {
  id: string;
  boardId: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  status: "active" | "paused" | "disabled";
  runCount: number;
  lastRunAt?: string;
  createdAt: string;
};

export type AutomationTrigger = {
  type: string;
  config: Record<string, unknown>;
};

export type AutomationCondition = {
  columnId: string;
  operator: string;
  value: unknown;
};

export type AutomationAction = {
  type: string;
  config: Record<string, unknown>;
};

// ── AI Chat ──

export type Conversation = {
  id: string;
  workspaceId: string;
  userId: string;
  title?: string;
  contextBoardId?: string;
  contextItemId?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  timestamp: string;
};

// ── API Response Wrappers ──

export type ApiResponse<T> = {
  data: T;
};

export type ApiListResponse<T> = {
  data: T[];
  total: number;
  nextCursor?: string;
};

export type ApiError = {
  error: string;
  details?: unknown;
};
