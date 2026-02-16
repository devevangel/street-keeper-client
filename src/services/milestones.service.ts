/**
 * Milestones Service
 * List milestones, pin/unpin, create, delete. Uses API client for backend calls.
 */

import { apiClient } from "../lib/api-client";
import type {
  MilestoneWithProgress,
  MilestoneType,
  CreateMilestoneInput,
} from "../types/api.types";

export async function getMilestoneTypes(): Promise<MilestoneType[]> {
  const res = await apiClient.get<{
    success: boolean;
    data: MilestoneType[];
  }>("/milestones/milestone-types");
  return res.data ?? [];
}

export async function getMilestones(
  projectId?: string,
): Promise<MilestoneWithProgress[]> {
  const url = projectId
    ? `/milestones?projectId=${encodeURIComponent(projectId)}`
    : "/milestones";
  const res = await apiClient.get<{
    success: boolean;
    data: MilestoneWithProgress[];
  }>(url);
  return res.data ?? [];
}

export async function createMilestone(
  input: CreateMilestoneInput,
): Promise<{ id: string; name: string }> {
  const res = await apiClient.post<{
    success: boolean;
    data: { id: string; name: string };
  }>("/milestones", input);
  if (!res.data) throw new Error("Create milestone returned no data");
  return res.data;
}

export async function pinMilestone(
  id: string,
  isPinned: boolean,
): Promise<void> {
  await apiClient.patch(`/milestones/${id}/pin`, { isPinned });
}

export async function deleteMilestone(id: string): Promise<void> {
  await apiClient.delete(`/milestones/${id}`);
}

// MVP Milestone Methods

export interface ProjectMilestonesResponse {
  active: Array<{
    id: string;
    name: string;
    targetValue: number;
    currentValue: number;
    type: { slug: string } | null;
  }>;
  completed: Array<{
    id: string;
    name: string;
    targetValue: number;
    currentValue: number;
    completedAt: string;
  }>;
  pendingCelebrations: Array<{
    id: string;
    name: string;
    projectName: string;
    completedAt: string;
    shareMessage: string;
  }>;
}

export async function getProjectMilestones(
  projectId: string,
): Promise<ProjectMilestonesResponse> {
  const res = await apiClient.get<{
    success: boolean;
    active: ProjectMilestonesResponse["active"];
    completed: ProjectMilestonesResponse["completed"];
    pendingCelebrations: ProjectMilestonesResponse["pendingCelebrations"];
  }>(`/projects/${projectId}/milestones`);
  return {
    active: res.active ?? [],
    completed: res.completed ?? [],
    pendingCelebrations: res.pendingCelebrations ?? [],
  };
}

export async function acknowledgeMilestone(milestoneId: string): Promise<void> {
  await apiClient.post(`/milestones/${milestoneId}/acknowledge`);
}
