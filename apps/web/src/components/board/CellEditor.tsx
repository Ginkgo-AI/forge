import type { Column, ColumnConfig, Item } from "@forge/shared";
import { useUpdateItem } from "../../hooks/useItems.ts";
import { StatusEditor } from "./StatusEditor.tsx";
import { PersonEditor } from "./PersonEditor.tsx";
import { DateEditor } from "./DateEditor.tsx";
import { TextEditor } from "./TextEditor.tsx";

type CellEditorProps = {
  column: Column;
  item: Item;
  boardId: string;
};

export function CellEditor({ column, item, boardId }: CellEditorProps) {
  const updateItem = useUpdateItem();
  const value = item.columnValues?.[column.id];

  function handleChange(newValue: unknown) {
    updateItem.mutate({
      id: item.id,
      boardId,
      data: {
        columnValues: { ...item.columnValues, [column.id]: newValue },
      },
    });
  }

  switch (column.type) {
    case "status": {
      const labels = (column.config as ColumnConfig)?.labels ?? {};
      return (
        <StatusEditor
          value={value as string | undefined}
          labels={labels}
          onChange={handleChange}
        />
      );
    }
    case "person":
      return (
        <PersonEditor
          value={value as string | undefined}
          onChange={handleChange}
        />
      );
    case "date":
      return (
        <DateEditor
          value={value as string | undefined}
          onChange={handleChange}
        />
      );
    default:
      return (
        <TextEditor
          value={value != null ? String(value) : undefined}
          onChange={handleChange}
        />
      );
  }
}
