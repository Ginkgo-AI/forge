import { Link, useLocation, useParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useBoard } from "../../hooks/useBoards.ts";
import { useDocument } from "../../hooks/useDocuments.ts";

type Crumb = {
  label: string;
  href?: string;
};

export function Breadcrumbs() {
  const location = useLocation();
  const { boardId, docId } = useParams();
  const { data: boardData } = useBoard(boardId);
  const { data: docData } = useDocument(docId);

  const board = (boardData as any)?.data;
  const doc = (docData as any)?.data;

  const crumbs: Crumb[] = [];
  const path = location.pathname;

  if (path.startsWith("/dashboard")) {
    crumbs.push({ label: "Dashboard" });
  } else if (path.startsWith("/boards/") && boardId) {
    crumbs.push({ label: "Boards" });
    crumbs.push({ label: board?.name ?? "Board", href: `/boards/${boardId}` });
    if (path.includes("/automations")) {
      crumbs.push({ label: "Automations" });
    }
  } else if (path.startsWith("/agents")) {
    crumbs.push({ label: "Agents" });
  } else if (path.startsWith("/docs")) {
    crumbs.push({ label: "Documents", href: "/docs" });
    if (docId && doc) {
      crumbs.push({ label: doc.title ?? "Document" });
    }
  } else if (path.startsWith("/settings")) {
    crumbs.push({ label: "Settings" });
  }

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        to="/dashboard"
        className="p-0.5 text-forge-text-muted hover:text-forge-text transition-colors"
      >
        <Home size={14} />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={12} className="text-forge-text-muted" />
          {crumb.href && i < crumbs.length - 1 ? (
            <Link
              to={crumb.href}
              className="text-forge-text-muted hover:text-forge-text transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-forge-text">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
