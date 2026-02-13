import { sql } from "drizzle-orm";
import { db } from "./index.js";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL || "postgresql://forge:forge@localhost:5435/forge";

const migrationClient = postgres(connectionString, { max: 1 });

async function push() {
  console.log("Creating database tables...");

  await migrationClient.unsafe(`
    -- Enums
    DO $$ BEGIN
      CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member', 'viewer');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE column_type AS ENUM (
        'text', 'number', 'status', 'person', 'date', 'timeline',
        'checkbox', 'link', 'file', 'formula', 'ai_generated', 'dropdown',
        'rating', 'tags', 'email', 'phone', 'location', 'dependency'
      );
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE board_view_type AS ENUM ('table', 'kanban', 'gantt', 'timeline', 'calendar', 'chart', 'cards');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE activity_type AS ENUM (
        'item_created', 'item_updated', 'item_deleted', 'item_moved',
        'column_value_changed', 'board_created', 'board_updated',
        'member_added', 'member_removed', 'automation_triggered',
        'agent_action', 'ai_chat'
      );
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE agent_status AS ENUM ('active', 'paused', 'disabled');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE agent_run_status AS ENUM ('queued', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE automation_status AS ENUM ('active', 'paused', 'disabled');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      password_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);

    -- Teams
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      workspace_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Workspaces
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      icon_url TEXT,
      owner_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role member_role NOT NULL DEFAULT 'member',
      joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Boards
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_by_id TEXT REFERENCES users(id),
      is_template BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      type column_type NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      config JSONB DEFAULT '{}'::jsonb,
      ai_prompt TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      color VARCHAR(7) DEFAULT '#579BFC',
      position INTEGER NOT NULL DEFAULT 0,
      collapsed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS board_views (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      type board_view_type NOT NULL,
      config JSONB DEFAULT '{}'::jsonb,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Items
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      parent_item_id TEXT,
      name VARCHAR(500) NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      column_values JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by_id TEXT REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS item_updates (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      author_id TEXT REFERENCES users(id),
      body TEXT NOT NULL,
      parent_update_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS item_files (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      file_name VARCHAR(500) NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER,
      mime_type VARCHAR(255),
      uploaded_by_id TEXT REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS item_dependencies (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      depends_on_item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Agents
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      system_prompt TEXT NOT NULL,
      tools JSONB NOT NULL DEFAULT '[]'::jsonb,
      triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
      guardrails JSONB DEFAULT '{"requireApproval":true,"maxActionsPerRun":10}'::jsonb,
      status agent_status NOT NULL DEFAULT 'active',
      created_by_id TEXT REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      triggered_by TEXT,
      status agent_run_status NOT NULL DEFAULT 'queued',
      messages JSONB DEFAULT '[]'::jsonb,
      tool_calls JSONB DEFAULT '[]'::jsonb,
      pending_actions JSONB DEFAULT '[]'::jsonb,
      error TEXT,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      title VARCHAR(255),
      context_board_id TEXT,
      context_item_id TEXT,
      messages JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Automations
    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      trigger JSONB NOT NULL,
      conditions JSONB DEFAULT '[]'::jsonb,
      actions JSONB NOT NULL,
      status automation_status NOT NULL DEFAULT 'active',
      run_count INTEGER NOT NULL DEFAULT 0,
      last_run_at TIMESTAMPTZ,
      created_by_id TEXT REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS automation_logs (
      id TEXT PRIMARY KEY,
      automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
      trigger_data JSONB,
      actions_executed JSONB,
      success BOOLEAN NOT NULL,
      error TEXT,
      executed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Documents
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_by_id TEXT NOT NULL,
      parent_doc_id TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS documents_workspace_idx ON documents(workspace_id);

    -- Activity Log
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      board_id TEXT,
      item_id TEXT,
      type activity_type NOT NULL,
      actor_id TEXT,
      actor_type VARCHAR(20),
      changes JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS activity_workspace_idx ON activity_log(workspace_id);
    CREATE INDEX IF NOT EXISTS activity_board_idx ON activity_log(board_id);
    CREATE INDEX IF NOT EXISTS activity_item_idx ON activity_log(item_id);
    CREATE INDEX IF NOT EXISTS activity_created_at_idx ON activity_log(created_at);
  `);

  console.log("All tables created successfully!");
  await migrationClient.end();
}

push().catch((err) => {
  console.error("Push failed:", err);
  process.exit(1);
});
