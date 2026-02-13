# Forge — User Walkthrough

This guide walks through every feature in Forge, from your first login to advanced AI agents and automations.

---

## Table of Contents

1. [Logging In](#1-logging-in)
2. [The Dashboard](#2-the-dashboard)
3. [Navigation](#3-navigation)
4. [Creating a Board](#4-creating-a-board)
5. [Working with the Table View](#5-working-with-the-table-view)
6. [Kanban View](#6-kanban-view)
7. [Item Detail Panel](#7-item-detail-panel)
8. [AI Chat](#8-ai-chat)
9. [AI Agents](#9-ai-agents)
10. [Automations](#10-automations)
11. [Documents](#11-documents)
12. [Settings](#12-settings)
13. [Keyboard Shortcuts](#13-keyboard-shortcuts)

---

## 1. Logging In

When you first open Forge, you'll see the login screen.

- **Sign up**: Click "Create an account", then fill in your name, email, and password (minimum 8 characters). Click **Create account**.
- **Log in**: Enter your email and password, then click **Sign in**.

After authentication, you'll land on the **Dashboard**.

> **Development mode**: If running locally with `NODE_ENV=development`, Forge auto-logs you in as the demo user — no credentials needed.

---

## 2. The Dashboard

The dashboard gives you a bird's-eye view of your workspace.

### Stats Cards

Four cards across the top show:

- **Active Boards** — Total number of boards in the workspace
- **Open Items** — Total items across all boards
- **Active Agents** — AI agents currently enabled
- **Automations** — Automation rules currently active

### Activity Timeline

An area chart showing daily activity counts over the last 14 days. Hover over any point to see the exact count for that day.

### Board Breakdown

A bar chart showing how many items each board has. Useful for spotting which boards are the busiest.

### Recent Activity

A scrollable feed on the right showing the latest actions in the workspace:

- Items created, updated, deleted, or moved
- Boards created or updated
- Automations triggered
- AI actions taken

Each entry shows an icon (color-coded by type), a description, and a relative timestamp like "5m ago".

### AI Workspace Report

Click **Generate Report** to have the AI write a narrative summary of your workspace's recent activity, trends, and recommendations. The report renders as formatted markdown directly on the dashboard.

### Boards List

Below the charts, a list of all boards with clickable links for quick access.

---

## 3. Navigation

### Sidebar

The left sidebar is your main navigation hub:

- **Forge logo** — Always returns you to the dashboard
- **Workspace selector** — Switch between workspaces (dropdown at the top)
- **Dashboard** — Workspace overview
- **Agents** — AI agents management
- **Docs** — Knowledge base documents
- **Boards** — All boards in the workspace, with a **+** button to create new ones
- **Settings** — Workspace and user settings (at the bottom)

### Breadcrumbs

The top bar shows breadcrumbs for your current location (e.g., Home > Board Name > Item Name), so you always know where you are.

### Mobile

On smaller screens, the sidebar collapses automatically. Tap the **hamburger menu** icon in the top-left to open it as an overlay. It closes when you tap a link or the backdrop.

---

## 4. Creating a Board

1. Click the **+** button next to "Boards" in the sidebar.
2. Enter a **name** and optional **description**.
3. Click **Create Board**.

Your new board opens immediately with a default group called "New Group" and a few starter columns. You can also ask the AI to create a board for you — see [AI Chat](#8-ai-chat).

### Deleting a Board

Hover over a board name in the sidebar to reveal a menu icon. Click it and select **Delete**. A confirmation dialog will ask you to confirm.

---

## 5. Working with the Table View

The table view is the default board layout. It organizes items into **groups** (colored row sections) with **columns** across the top.

### Groups

- Each group has a **colored header** showing the group name and item count.
- Click the **collapse arrow** to toggle a group open or closed.
- Add a new item to any group using the input row at the bottom of the group.

### Adding Items

1. Click the text input at the bottom of any group.
2. Type the item name.
3. Press **Enter** to create it, or **Escape** to cancel.

### Column Types

| Type | How It Works |
|------|-------------|
| **Text** | Click the cell to type. Press Enter or click away to save. |
| **Status** | Click to open a dropdown with colored labels (e.g., Not Started, Working, Done, Stuck). |
| **Person** | Click to open a dropdown of workspace members. Select someone to assign them. |
| **Date** | Click to open a date picker. Select a date to set it. |

### Inline Editing

Every cell in the table is editable inline:

1. **Click** any cell to enter edit mode.
2. Make your change (type text, pick from dropdown, choose a date).
3. **Enter** or **click outside** to save.
4. **Escape** to cancel without saving.

### Deleting Items

Click the **three-dot menu** that appears when you hover over a row, then select **Delete**. Confirm in the dialog that appears.

---

## 6. Kanban View

Switch to Kanban by clicking the **Kanban** tab in the board header.

### How It Works

- Items are organized into **vertical lanes** based on their status column.
- Each lane has a **colored header** showing the status label and item count.
- A **"No Status"** lane collects items without a status set.

### Drag and Drop

- **Drag** any card by clicking and holding it.
- **Drop** it into a different lane to change its status.
- The lane highlights with a border when you hover over it.

### Cards

Each Kanban card shows:
- The item name
- Up to 2 key column values (e.g., assigned person, due date)

Click any card to open its [detail panel](#7-item-detail-panel).

---

## 7. Item Detail Panel

Click an item name (in table view) or a card (in Kanban view) to open the detail panel. It slides in from the right side of the screen.

### What's Inside

- **Item name** — Click to edit inline.
- **Fields** — All board columns listed vertically, each with an inline editor matching its type (text input, status dropdown, person picker, date picker).
- **Updates / Comments** — A threaded comment section below the fields.
- **Metadata** — Created and last updated timestamps at the bottom.

### Comments

- Type in the comment box at the bottom.
- Press **Enter** to post (or **Shift+Enter** for a new line).
- Comments show the author's initials, their name, the timestamp, and the message body.

### Closing

Press **Escape** or click outside the panel to close it. On mobile, the panel takes up the full screen.

---

## 8. AI Chat

Forge includes a built-in AI assistant with full read/write access to your workspace data.

### Opening the Chat

Click **"Ask Forge AI"** in the top-right corner of any page. The chat panel opens on the right side (or full-screen on mobile). Click **"Close AI"** to dismiss it.

### Having a Conversation

Type a message and press Enter. The AI responds with streaming text. Your conversation is saved automatically and persists across page navigation.

### Board Context

When you're viewing a board, the chat shows a **"Board context active"** indicator. This means the AI is aware of the current board's structure, columns, groups, and items — so you can ask questions like "what items are overdue?" without specifying which board.

### What the AI Can Do

The AI has access to **12 tools** and can perform real actions on your workspace:

| Capability | Example Prompt |
|-----------|---------------|
| **Create a board** | "Create a project board for a mobile app launch with status, assignee, and due date columns" |
| **Generate items from text** | "Here are my meeting notes: [paste notes]. Extract the action items into the board." |
| **Query data** | "How many items are marked as Stuck?" |
| **Update items** | "Mark the 'Design review' task as Done" |
| **Add comments** | "Add a note to the 'API integration' item saying we're blocked on credentials" |
| **Manage structure** | "Add a 'Priority' status column with High, Medium, and Low options" |
| **List members** | "Who's on this workspace?" |

### Tool Call Visibility

When the AI uses a tool, you'll see a **tool card** below its message showing:
- The tool name (e.g., "create_item")
- A status indicator: spinning (running), green checkmark (done), or red alert (error)

### Choosing a Model

If multiple AI providers are configured, use the **model dropdown** at the top of the chat to switch between them.

---

## 9. AI Agents

Agents are persistent AI configurations that can run autonomously in response to events or on demand.

### Creating an Agent

1. Go to the **Agents** page from the sidebar.
2. Click **+ Create Agent**.
3. Fill in the configuration:

| Field | Description |
|-------|-------------|
| **Name** | A descriptive name (e.g., "Bug Triage Agent") |
| **Description** | What the agent does (optional) |
| **System Prompt** | Instructions that define the agent's behavior and personality |
| **Tools** | Which workspace tools the agent can use (checkboxes) |
| **Trigger** | **Manual** (run on demand) or **Event** (respond to item_created, item_updated, etc.) |
| **Guardrails** | Whether to require human approval before actions, and a max actions-per-run limit (1-100) |

4. Click **Create Agent**.

### Managing Agents

Each agent card shows its name, description, status, and trigger type.

- **Run Now** — Manually trigger the agent (disabled while already running)
- **Pause / Resume** — Toggle the agent between active and paused states
- **Delete** — Remove the agent (with confirmation)

### Run History

Expand **"Recent runs"** on any agent card to see past executions:
- Status (completed, failed, running, queued)
- Number of tool calls made
- Timestamp

### Event Triggers

When configured with an event trigger, the agent runs automatically when the specified event occurs in the workspace. You can optionally scope it to a specific board.

Available events:
- `item_created` — A new item is added
- `item_updated` — An item's name or fields change
- `column_value_changed` — A specific column value is modified
- `item_deleted` — An item is removed

---

## 10. Automations

Automations are rule-based workflows that run when specific conditions are met. They're scoped to individual boards.

### Creating an Automation

1. Open a board, then navigate to its **Automations** tab.
2. Click **+ Create Automation**.
3. Configure:

**Trigger** — What starts the automation:
- Status Change
- Column Change
- Item Created
- Item Deleted

**Conditions** (optional) — Filter when the automation should actually run:
- Pick a column, an operator (equals, not_equals, contains, greater_than, less_than, is_empty, is_not_empty), and a value.
- Add multiple conditions — all must be true for the automation to fire.

**Actions** — What happens when it triggers (at least one required):

| Action | What It Does |
|--------|-------------|
| **Change Column** | Set a column to a specific value |
| **Create Item** | Create a new item in a group |
| **Move Item** | Move the item to a different group |
| **Notify** | Send a notification |
| **AI Step** | Run an AI prompt to decide what to do |

4. Click **Create Automation**.

### Managing Automations

Each automation card shows its trigger type, action count, run count, and last run time.

- **Pause / Resume** — Toggle between active and paused
- **Delete** — Remove the automation (with confirmation)

---

## 11. Documents

The Documents section is a workspace-level markdown knowledge base.

### Layout

The page is split into two panes:
- **Left sidebar** — A list of all documents with a **+** button to create new ones
- **Right editor** — The document title and content

### Creating a Document

Click the **+** button in the documents sidebar. A new document named "Untitled" is created and selected automatically.

### Editing

- Click the **title** at the top to rename the document.
- Write content in the editor area using **Markdown** syntax.
- Changes **auto-save** after 1 second of inactivity. A "Saving..." indicator appears briefly.

### Preview Mode

Click the **eye icon** to toggle between edit and preview mode. Preview renders your markdown with full formatting — headings, lists, bold, links, code blocks, etc.

### Deleting a Document

Hover over a document in the sidebar to reveal a **trash icon**. Click it and confirm the deletion.

---

## 12. Settings

Access settings from the **Settings** link at the bottom of the sidebar. There are four tabs.

### Workspace

- **Name** and **Description** — Edit your workspace details and click **Save changes**.
- **Members** — A read-only list of workspace members showing name, email, and role (Owner, Admin, Member, or Viewer).

### AI Configuration

- **Providers** — Shows all configured AI providers (based on environment variables). Each provider card lists its available models and shows a **Test** button to verify the connection works.
- **Default Configuration** — Displays the current default provider and model.

> To add providers, set the relevant environment variables (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.) and restart the server.

### Profile

- **Display name** — Change how your name appears across the workspace.
- **Avatar URL** — Set a URL for your profile picture.
- **Change password** — Enter your current password and a new one (minimum 8 characters).

### Notifications

Toggle email notifications for:
- **Agent completions** — When an agent finishes a run
- **Automation failures** — When an automation encounters an error
- **Mentions** — When you're mentioned in a comment

> Note: Email delivery is a planned feature. Preferences are saved locally for now.

---

## 13. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Escape** | Close modals, panels, menus, and cancel inline editing |
| **Enter** | Save inline edits, submit forms, create items, send comments |
| **Shift+Enter** | New line in comment input |
| **Click outside** | Close dropdowns, context menus, and the item detail panel |

---

## Tips

- **Let the AI build your board.** Instead of manually creating columns and groups, describe what you need in the AI chat: *"Create a sprint board with columns for status, assignee, priority, and due date. Add groups for Sprint 1 and Backlog."*
- **Extract items from text.** Paste meeting notes, emails, or any text into the AI chat and ask it to create items. It will parse the text and populate your board.
- **Use agents for recurring work.** Set up an event-triggered agent to automatically triage new items, assign priorities, or post summaries.
- **Combine automations and AI steps.** An automation can include an "AI Step" action that uses a custom prompt to decide what to do — like auto-categorizing items based on their title.
- **Keyboard-first editing.** In table view, you can click a cell, type, press Enter to save, then Tab or click the next cell. Escape always cancels.
