import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import type { WorkspaceMember } from "@forge/shared";

type MembersResponse = { data: WorkspaceMember[]; total: number };

export function useMembers(workspaceId: string | undefined) {
  return useQuery<MembersResponse>({
    queryKey: ["members", workspaceId],
    queryFn: () => api.listMembers(workspaceId!) as Promise<MembersResponse>,
    enabled: !!workspaceId,
  });
}
