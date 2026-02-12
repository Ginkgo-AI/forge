import { EventEmitter } from "events";

// Discriminated union of all forge events
export type ForgeEvent =
  | {
      type: "item_created";
      boardId: string;
      itemId: string;
      groupId: string;
      actorId: string;
      columnValues: Record<string, unknown>;
    }
  | {
      type: "item_updated";
      boardId: string;
      itemId: string;
      actorId: string;
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }
  | {
      type: "column_value_changed";
      boardId: string;
      itemId: string;
      actorId: string;
      columnId: string;
      oldValue: unknown;
      newValue: unknown;
    }
  | {
      type: "item_deleted";
      boardId: string;
      itemId: string;
      actorId: string;
    };

export type ForgeEventType = ForgeEvent["type"];

type EventHandler = (event: ForgeEvent) => void;

class ForgeEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(200);
  }

  emit(event: ForgeEvent) {
    this.emitter.emit(event.type, event);
    this.emitter.emit("*", event);
  }

  on(type: ForgeEventType | "*", handler: EventHandler) {
    this.emitter.on(type, handler);
  }

  off(type: ForgeEventType | "*", handler: EventHandler) {
    this.emitter.off(type, handler);
  }
}

export const eventBus = new ForgeEventBus();
