import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema/index.js";

const connectionString =
  process.env.DATABASE_URL || "postgresql://forge:forge@localhost:5435/forge";

const client = postgres(connectionString);
const db = drizzle(client, { schema });

let counter = 0;
function id(prefix: string) {
  counter++;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${ts}${rand}${counter}`;
}

async function seed() {
  console.log("Seeding database...");

  // Dev user — upsert
  const devEmail = "dev@forge.local";
  const existingUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, devEmail));

  let devUserId: string;
  if (existingUsers.length > 0) {
    devUserId = existingUsers[0].id;
    console.log(`  Found existing dev user: ${devUserId}`);
  } else {
    devUserId = id("usr");
    await db.insert(schema.users).values({
      id: devUserId,
      email: devEmail,
      name: "Dev User",
    });
    console.log(`  Created dev user: ${devUserId}`);
  }

  // Workspace
  const wsId = id("ws");
  await db.insert(schema.workspaces).values({
    id: wsId,
    name: "My Workspace",
    description: "Default development workspace",
    ownerId: devUserId,
  });

  // Membership
  await db.insert(schema.workspaceMembers).values({
    id: id("wm"),
    workspaceId: wsId,
    userId: devUserId,
    role: "owner",
  });

  // Board: Sprint Planning
  const boardId = id("brd");
  await db.insert(schema.boards).values({
    id: boardId,
    workspaceId: wsId,
    name: "Sprint Planning",
    description: "Track sprint tasks and assignments",
    createdById: devUserId,
  });

  // Columns
  const colStatus = id("col");
  const colPerson = id("col");
  const colDate = id("col");
  const colPriority = id("col");

  await db.insert(schema.columns).values([
    {
      id: colStatus,
      boardId,
      title: "Status",
      type: "status",
      position: 0,
      config: {
        labels: {
          not_started: { label: "Not Started", color: "#C4C4C4" },
          working: { label: "Working on it", color: "#FDAB3D" },
          stuck: { label: "Stuck", color: "#E2445C" },
          done: { label: "Done", color: "#00C875" },
        },
      },
    },
    {
      id: colPerson,
      boardId,
      title: "Owner",
      type: "person",
      position: 1,
      config: {},
    },
    {
      id: colDate,
      boardId,
      title: "Due Date",
      type: "date",
      position: 2,
      config: {},
    },
    {
      id: colPriority,
      boardId,
      title: "Priority",
      type: "status",
      position: 3,
      config: {
        labels: {
          low: { label: "Low", color: "#579BFC" },
          medium: { label: "Medium", color: "#FDAB3D" },
          high: { label: "High", color: "#E2445C" },
          critical: { label: "Critical", color: "#333333" },
        },
      },
    },
  ]);

  // Group
  const groupId = id("grp");
  await db.insert(schema.groups).values({
    id: groupId,
    boardId,
    title: "Sprint 12",
    color: "#579BFC",
    position: 0,
  });

  // Items
  const itemsData = [
    {
      name: "Set up authentication flow",
      columnValues: {
        [colStatus]: "working",
        [colPerson]: devUserId,
        [colDate]: "2026-02-15",
        [colPriority]: "high",
      },
    },
    {
      name: "Design database schema",
      columnValues: {
        [colStatus]: "done",
        [colPerson]: devUserId,
        [colDate]: "2026-02-10",
        [colPriority]: "high",
      },
    },
    {
      name: "Implement board views",
      columnValues: {
        [colStatus]: "working",
        [colPerson]: devUserId,
        [colDate]: "2026-02-20",
        [colPriority]: "medium",
      },
    },
    {
      name: "API rate limiting",
      columnValues: {
        [colStatus]: "stuck",
        [colPerson]: devUserId,
        [colDate]: "2026-02-12",
        [colPriority]: "high",
      },
    },
    {
      name: "Write integration tests",
      columnValues: {
        [colStatus]: "not_started",
        [colDate]: "2026-02-25",
        [colPriority]: "low",
      },
    },
  ];

  for (let i = 0; i < itemsData.length; i++) {
    await db.insert(schema.items).values({
      id: id("itm"),
      boardId,
      groupId,
      name: itemsData[i].name,
      position: i,
      columnValues: itemsData[i].columnValues,
      createdById: devUserId,
    });
  }

  // Activity log entry
  await db.insert(schema.activityLog).values({
    id: id("act"),
    workspaceId: wsId,
    boardId,
    type: "board_created",
    actorId: devUserId,
    actorType: "user",
    changes: { description: "Created board 'Sprint Planning'" },
  });

  console.log("Seed complete!");
  console.log(`  User: ${devUserId} (dev@forge.local)`);
  console.log(`  Workspace: ${wsId}`);
  console.log(`  Board: ${boardId}`);
  console.log(`  Group: ${groupId}`);
  console.log(`  Items: ${itemsData.length}`);

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
