import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  Eye,
  Edit3,
} from "lucide-react";
import { useWorkspaceStore } from "../stores/workspace.ts";
import {
  useDocuments,
  useDocument,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from "../hooks/useDocuments.ts";
import { Button } from "../components/ui/Button.tsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.tsx";
import { toast } from "../components/ui/Toaster.tsx";

export function DocumentsPage() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const { data: docsData, isLoading } = useDocuments(workspace?.id);
  const { data: docData } = useDocument(docId);
  const createDoc = useCreateDocument(workspace?.id);
  const updateDoc = useUpdateDocument(workspace?.id);
  const deleteDoc = useDeleteDocument(workspace?.id);

  const [preview, setPreview] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const docs = (docsData as any)?.data ?? [];
  const currentDoc = (docData as any)?.data;

  useEffect(() => {
    if (currentDoc) {
      setTitle(currentDoc.title ?? "");
      setContent(currentDoc.content ?? "");
      setPreview(false);
    }
  }, [currentDoc?.id]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (!docId || !currentDoc) return;
    if (title === currentDoc.title && content === currentDoc.content) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateDoc.mutate({ id: docId, title, content });
    }, 1000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, content]);

  const handleCreate = () => {
    if (!workspace) return;
    createDoc.mutate(
      { workspaceId: workspace.id, title: "Untitled" },
      {
        onSuccess: (data: any) => {
          navigate(`/docs/${data.data.id}`);
          toast.success("Document created");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteDoc.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Document deleted");
        if (docId === deleteId) navigate("/docs");
      },
    });
  };

  return (
    <div className="flex gap-0 -m-4 sm:-m-6 h-[calc(100vh-3rem)]">
      {/* Document tree sidebar */}
      <div className="w-60 shrink-0 border-r border-forge-border bg-forge-surface flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-forge-border">
          <span className="text-sm font-medium text-forge-text">Documents</span>
          <button
            onClick={handleCreate}
            disabled={createDoc.isPending}
            className="p-1 rounded hover:bg-forge-surface-hover transition-colors"
          >
            <Plus size={14} className="text-forge-text-muted" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={16} className="animate-spin text-forge-text-muted" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-8 text-sm text-forge-text-muted">
              No documents yet
            </div>
          ) : (
            docs.map((doc: any) => (
              <div
                key={doc.id}
                className={`group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                  docId === doc.id
                    ? "bg-forge-accent/15 text-forge-accent"
                    : "text-forge-text-muted hover:bg-forge-surface-hover hover:text-forge-text"
                }`}
                onClick={() => navigate(`/docs/${doc.id}`)}
              >
                <FileText size={14} className="shrink-0" />
                <span className="truncate flex-1">{doc.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(doc.id);
                  }}
                  className="p-0.5 rounded hover:bg-forge-border opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} className="text-forge-text-muted" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {docId && currentDoc ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-forge-border shrink-0">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold bg-transparent border-none outline-none text-forge-text flex-1"
                placeholder="Document title"
              />
              <div className="flex items-center gap-2">
                {updateDoc.isPending && (
                  <span className="text-xs text-forge-text-muted">Saving...</span>
                )}
                <button
                  onClick={() => setPreview(!preview)}
                  className={`p-1.5 rounded-md transition-colors ${
                    preview
                      ? "bg-forge-accent/15 text-forge-accent"
                      : "text-forge-text-muted hover:bg-forge-surface-hover"
                  }`}
                >
                  {preview ? <Edit3 size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {preview ? (
                <div className="prose prose-invert max-w-none p-6 text-sm text-forge-text whitespace-pre-wrap">
                  {content || "No content yet."}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your document in markdown..."
                  className="w-full h-full p-6 bg-transparent text-sm text-forge-text resize-none focus:outline-none font-mono"
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={40} className="mx-auto mb-3 text-forge-text-muted opacity-30" />
              <p className="text-sm text-forge-text-muted">
                Select a document or create a new one
              </p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={handleCreate}>
                <Plus size={14} />
                New document
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
