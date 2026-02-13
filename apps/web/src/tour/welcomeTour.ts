import type { TourStep } from "../stores/tour.ts";

export const welcomeTourSteps: TourStep[] = [
  {
    target: "sidebar",
    title: "Welcome to Forge",
    content:
      "Your AI-powered work management platform. Let's take a quick tour.",
    placement: "right",
    route: "/dashboard",
  },
  {
    target: "dashboard-stats",
    title: "Dashboard",
    content:
      "See your workspace at a glance — boards, items, agents, and automations.",
    placement: "bottom",
    route: "/dashboard",
  },
  {
    target: "sidebar-boards",
    title: "Boards",
    content:
      "Create boards to organize your work. Each board has columns, groups, and items.",
    placement: "right",
    route: "/dashboard",
  },
  {
    target: "ai-chat-button",
    title: "AI Assistant",
    content:
      "Click here to chat with Forge AI. It can create boards, update items, and answer questions about your data.",
    placement: "bottom",
    route: "/dashboard",
  },
  {
    target: "sidebar-agents",
    title: "AI Agents",
    content:
      "Build persistent AI agents that run on triggers or on demand.",
    placement: "right",
    route: "/dashboard",
  },
  {
    target: "sidebar-docs",
    title: "Documents",
    content: "A markdown knowledge base for your team's documentation.",
    placement: "right",
    route: "/dashboard",
  },
  {
    target: "sidebar-settings",
    title: "Settings",
    content:
      "Configure your workspace, AI providers, profile, and notifications.",
    placement: "right",
    route: "/dashboard",
  },
  {
    target: "",
    title: "You're all set!",
    content:
      "Start by creating a board or asking the AI to build one for you.",
    placement: "bottom",
    route: "/dashboard",
  },
];
