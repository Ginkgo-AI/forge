import { nanoid } from "nanoid";

const PREFIXES = {
  user: "usr",
  workspace: "ws",
  board: "brd",
  column: "col",
  group: "grp",
  item: "itm",
  update: "upd",
  agent: "agt",
  activity: "act",
  file: "fil",
  view: "viw",
  automation: "aut",
  conversation: "cnv",
  team: "tm",
  dependency: "dep",
  run: "run",
} as const;

type EntityPrefix = keyof typeof PREFIXES;

export function generateId(entity: EntityPrefix): string {
  return `${PREFIXES[entity]}_${nanoid(16)}`;
}
