import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    X,
    Sparkles,
    Loader2,
    Check,
    ChevronRight,
    ChevronLeft,
    Wand2,
    RefreshCw,
} from "lucide-react";
import { useWorkspaceStore } from "../../stores/workspace.ts";
import { useCreateAgent, useGenerateAgent } from "../../hooks/useAgents.ts";

const AVAILABLE_TOOLS = [
    { id: "list_boards", label: "List Boards" },
    { id: "get_board", label: "Get Board" },
    { id: "create_board", label: "Create Board" },
    { id: "add_column", label: "Add Column" },
    { id: "add_group", label: "Add Group" },
    { id: "list_items", label: "List Items" },
    { id: "get_item", label: "Get Item" },
    { id: "create_item", label: "Create Item" },
    { id: "update_item", label: "Update Item" },
    { id: "delete_item", label: "Delete Item" },
    { id: "add_item_update", label: "Add Update" },
    { id: "list_workspace_members", label: "List Members" },
];

const STEPS = ["Describe", "Review & Edit", "Create"] as const;

const LOADING_MESSAGES = [
    "Analyzing your requirements…",
    "Choosing the right tools…",
    "Crafting the system prompt…",
    "Tuning guardrails…",
    "Polishing the config…",
];

type AgentConfig = {
    name: string;
    description: string;
    systemPrompt: string;
    tools: string[];
    triggerType: "manual" | "event";
    eventType?: string;
    guardrails: {
        requireApproval: boolean;
        maxActionsPerRun: number;
    };
};

type AgentBuilderWizardProps = {
    open: boolean;
    onClose: () => void;
};

export function AgentBuilderWizard({ open, onClose }: AgentBuilderWizardProps) {
    const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
    const generateAgent = useGenerateAgent();
    const createAgent = useCreateAgent();

    const [step, setStep] = useState(0);
    const [prompt, setPrompt] = useState("");
    const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
    const [draftConfig, setDraftConfig] = useState<AgentConfig | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Cycle loading messages while generating
    useEffect(() => {
        if (!generateAgent.isPending) return;
        setLoadingMsgIdx(0);
        const interval = setInterval(() => {
            setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
        }, 2200);
        return () => clearInterval(interval);
    }, [generateAgent.isPending]);

    // Reset on open/close
    useEffect(() => {
        if (!open) {
            setStep(0);
            setPrompt("");
            setDraftConfig(null);
            setError(null);
            generateAgent.reset();
        }
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    function handleGenerate() {
        if (!prompt.trim() || !currentWorkspace) return;
        setError(null);
        generateAgent.mutate(
            { description: prompt.trim(), workspaceId: currentWorkspace.id },
            {
                onSuccess: (res) => {
                    setDraftConfig(res.data.agentConfig);
                    setStep(1);
                },
                onError: (err) => {
                    setError(err.message || "Failed to generate agent config");
                },
            }
        );
    }

    function handleRegenerate() {
        setDraftConfig(null);
        setStep(0);
        handleGenerate();
    }

    function handleCreate() {
        if (!draftConfig || !currentWorkspace) return;

        const triggers =
            draftConfig.triggerType === "manual"
                ? [{ type: "manual" as const, config: {} }]
                : [
                    {
                        type: "event" as const,
                        config: {
                            ...(draftConfig.eventType
                                ? { eventType: draftConfig.eventType }
                                : {}),
                        },
                    },
                ];

        createAgent.mutate(
            {
                workspaceId: currentWorkspace.id,
                name: draftConfig.name,
                description: draftConfig.description || undefined,
                systemPrompt: draftConfig.systemPrompt,
                tools: draftConfig.tools,
                triggers,
                guardrails: draftConfig.guardrails,
            },
            {
                onSuccess: () => {
                    onClose();
                },
                onError: (err) => {
                    setError(err.message || "Failed to create agent");
                },
            }
        );
    }

    function updateDraft<K extends keyof AgentConfig>(
        key: K,
        value: AgentConfig[K]
    ) {
        setDraftConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
    }

    function toggleTool(toolId: string) {
        if (!draftConfig) return;
        const tools = draftConfig.tools.includes(toolId)
            ? draftConfig.tools.filter((t) => t !== toolId)
            : [...draftConfig.tools, toolId];
        updateDraft("tools", tools);
    }

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="bg-forge-surface border border-forge-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
                style={{
                    animation: "wizard-enter 0.25s ease-out",
                }}
            >
                {/* Header */}
                <div className="relative px-6 pt-5 pb-4 border-b border-forge-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                    background: "linear-gradient(135deg, #8b5cf6, #6366f1, #3b82f6)",
                                }}
                            >
                                <Wand2 size={16} className="text-white" />
                            </div>
                            <h2 className="text-lg font-semibold">AI Agent Builder</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-md hover:bg-forge-surface-hover transition-colors"
                        >
                            <X size={16} className="text-forge-text-muted" />
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-0">
                        {STEPS.map((label, i) => (
                            <div key={label} className="flex items-center flex-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-300 ${i < step
                                                ? "bg-emerald-500 text-white"
                                                : i === step
                                                    ? "text-white"
                                                    : "bg-forge-surface-hover text-forge-text-muted"
                                            }`}
                                        style={
                                            i === step
                                                ? {
                                                    background:
                                                        "linear-gradient(135deg, #8b5cf6, #6366f1)",
                                                }
                                                : undefined
                                        }
                                    >
                                        {i < step ? <Check size={14} /> : i + 1}
                                    </div>
                                    <span
                                        className={`text-xs font-medium truncate transition-colors ${i <= step
                                                ? "text-forge-text"
                                                : "text-forge-text-muted"
                                            }`}
                                    >
                                        {label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div
                                        className={`flex-1 h-px mx-3 transition-colors ${i < step ? "bg-emerald-500" : "bg-forge-border"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                    {/* Step 0: Describe */}
                    {step === 0 && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-semibold flex items-center gap-2 mb-1">
                                    <Sparkles
                                        size={18}
                                        className="text-purple-400"
                                    />
                                    Describe your agent
                                </h3>
                                <p className="text-sm text-forge-text-muted">
                                    Tell us what you want your agent to do in plain English. The
                                    AI will generate a complete configuration for you.
                                </p>
                            </div>

                            <textarea
                                autoFocus
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. An agent that monitors new items on my Sprint Board and automatically assigns priority levels based on the item title and description..."
                                rows={5}
                                className="w-full bg-forge-surface-hover/50 border border-forge-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 resize-none placeholder:text-forge-text-muted/50 transition-all"
                            />

                            {/* Example chips */}
                            <div className="space-y-2">
                                <p className="text-xs text-forge-text-muted font-medium">
                                    Try an example:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Triage new bug reports and assign priority",
                                        "Weekly board summary reporter",
                                        "Auto-categorize items based on their title",
                                    ].map((example) => (
                                        <button
                                            key={example}
                                            type="button"
                                            onClick={() => setPrompt(example)}
                                            className="px-3 py-1.5 text-xs rounded-full border border-forge-border text-forge-text-muted hover:text-forge-text hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Step 1: Review & Edit */}
                    {step === 1 && draftConfig && (
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Name
                                </label>
                                <input
                                    value={draftConfig.name}
                                    onChange={(e) => updateDraft("name", e.target.value)}
                                    className="w-full bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Description
                                </label>
                                <input
                                    value={draftConfig.description}
                                    onChange={(e) => updateDraft("description", e.target.value)}
                                    className="w-full bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
                                />
                            </div>

                            {/* System Prompt */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    System Prompt
                                </label>
                                <textarea
                                    value={draftConfig.systemPrompt}
                                    onChange={(e) => updateDraft("systemPrompt", e.target.value)}
                                    rows={6}
                                    className="w-full bg-transparent border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent resize-none font-mono text-xs leading-relaxed"
                                />
                            </div>

                            {/* Tools */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Tools
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_TOOLS.map((tool) => (
                                        <button
                                            key={tool.id}
                                            type="button"
                                            onClick={() => toggleTool(tool.id)}
                                            className={`px-2.5 py-1 rounded-md text-xs transition-all ${draftConfig.tools.includes(tool.id)
                                                    ? "bg-forge-accent text-white shadow-sm"
                                                    : "bg-forge-surface-hover text-forge-text-muted hover:text-forge-text"
                                                }`}
                                        >
                                            {tool.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Trigger */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Trigger
                                </label>
                                <div className="flex gap-2">
                                    {(["manual", "event"] as const).map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => updateDraft("triggerType", type)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${draftConfig.triggerType === type
                                                    ? "bg-forge-accent text-white"
                                                    : "bg-forge-surface-hover text-forge-text-muted"
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                {draftConfig.triggerType === "event" && (
                                    <select
                                        value={draftConfig.eventType || ""}
                                        onChange={(e) =>
                                            updateDraft(
                                                "eventType",
                                                e.target.value || undefined
                                            )
                                        }
                                        className="mt-2 w-full bg-forge-surface border border-forge-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-forge-accent"
                                    >
                                        <option value="">Any event</option>
                                        <option value="item_created">Item Created</option>
                                        <option value="item_updated">Item Updated</option>
                                        <option value="column_value_changed">
                                            Column Value Changed
                                        </option>
                                        <option value="item_deleted">Item Deleted</option>
                                    </select>
                                )}
                            </div>

                            {/* Guardrails */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Guardrails
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={draftConfig.guardrails.requireApproval}
                                            onChange={(e) =>
                                                updateDraft("guardrails", {
                                                    ...draftConfig.guardrails,
                                                    requireApproval: e.target.checked,
                                                })
                                            }
                                            className="rounded border-forge-border"
                                        />
                                        Require approval before actions
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-forge-text-muted">
                                            Max actions per run:
                                        </label>
                                        <input
                                            type="number"
                                            value={draftConfig.guardrails.maxActionsPerRun}
                                            onChange={(e) =>
                                                updateDraft("guardrails", {
                                                    ...draftConfig.guardrails,
                                                    maxActionsPerRun: Number(e.target.value),
                                                })
                                            }
                                            min={1}
                                            max={100}
                                            className="w-20 bg-transparent border border-forge-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-forge-accent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Step 2: Confirm */}
                    {step === 2 && draftConfig && (
                        <div className="space-y-4">
                            <div className="text-center py-2">
                                <div
                                    className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.15))",
                                    }}
                                >
                                    <Sparkles size={24} className="text-purple-400" />
                                </div>
                                <h3 className="text-base font-semibold">
                                    Ready to create your agent
                                </h3>
                                <p className="text-sm text-forge-text-muted mt-1">
                                    Review the summary below and hit Create to bring it to life.
                                </p>
                            </div>

                            <div className="bg-forge-surface-hover/50 rounded-lg border border-forge-border p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        {draftConfig.name}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
                                        Ready
                                    </span>
                                </div>
                                {draftConfig.description && (
                                    <p className="text-sm text-forge-text-muted">
                                        {draftConfig.description}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-1.5">
                                    {draftConfig.tools.map((tool) => (
                                        <span
                                            key={tool}
                                            className="px-2 py-0.5 rounded bg-forge-surface text-xs text-forge-text-muted border border-forge-border"
                                        >
                                            {tool}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-forge-text-muted">
                                    <span>
                                        Trigger:{" "}
                                        <span className="text-forge-text capitalize">
                                            {draftConfig.triggerType}
                                        </span>
                                    </span>
                                    <span>
                                        Approval:{" "}
                                        <span className="text-forge-text">
                                            {draftConfig.guardrails.requireApproval ? "Yes" : "No"}
                                        </span>
                                    </span>
                                    <span>
                                        Max actions:{" "}
                                        <span className="text-forge-text">
                                            {draftConfig.guardrails.maxActionsPerRun}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Loading overlay on step 0 */}
                    {generateAgent.isPending && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                                style={{
                                    background:
                                        "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))",
                                }}
                            >
                                <Loader2
                                    size={22}
                                    className="animate-spin text-purple-400"
                                />
                            </div>
                            <p className="text-sm text-forge-text-muted transition-all animate-pulse">
                                {LOADING_MESSAGES[loadingMsgIdx]}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-forge-border flex items-center justify-between">
                    <div>
                        {step === 1 && (
                            <button
                                type="button"
                                onClick={handleRegenerate}
                                disabled={generateAgent.isPending}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-forge-text-muted hover:text-forge-text rounded-md hover:bg-forge-surface-hover transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={14} />
                                Regenerate
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {step > 0 && (
                            <button
                                type="button"
                                onClick={() => setStep((s) => s - 1)}
                                className="flex items-center gap-1 px-4 py-2 text-sm rounded-md text-forge-text-muted hover:bg-forge-surface-hover transition-colors"
                            >
                                <ChevronLeft size={14} />
                                Back
                            </button>
                        )}

                        {step === 0 && (
                            <button
                                onClick={handleGenerate}
                                disabled={
                                    !prompt.trim() ||
                                    prompt.trim().length < 10 ||
                                    generateAgent.isPending
                                }
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-md text-white transition-all disabled:opacity-40"
                                style={{
                                    background: prompt.trim().length >= 10
                                        ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
                                        : undefined,
                                    backgroundColor: prompt.trim().length < 10 ? "rgba(99,102,241,0.3)" : undefined,
                                }}
                            >
                                {generateAgent.isPending ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Generating…
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={14} />
                                        Generate with AI
                                    </>
                                )}
                            </button>
                        )}

                        {step === 1 && (
                            <button
                                onClick={() => setStep(2)}
                                disabled={!draftConfig?.name || !draftConfig?.systemPrompt}
                                className="flex items-center gap-1 px-5 py-2 text-sm font-medium rounded-md bg-forge-accent hover:bg-forge-accent-hover text-white transition-colors disabled:opacity-50"
                            >
                                Next
                                <ChevronRight size={14} />
                            </button>
                        )}

                        {step === 2 && (
                            <button
                                onClick={handleCreate}
                                disabled={createAgent.isPending}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-md text-white transition-all"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #10b981, #059669)",
                                }}
                            >
                                {createAgent.isPending ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Creating…
                                    </>
                                ) : (
                                    <>
                                        <Check size={14} />
                                        Create Agent
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Wizard entrance animation */}
            <style>{`
        @keyframes wizard-enter {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
        </div>,
        document.body
    );
}
