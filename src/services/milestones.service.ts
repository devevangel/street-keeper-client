/**
 * Milestones are currently disabled.
 * This module remains as a compatibility shim for legacy imports.
 */

import type {
  MilestoneWithProgress,
  MilestoneType,
  CreateMilestoneInput,
} from "../types/api.types";

const MILESTONES_DISABLED_ERROR = new Error("Milestones are disabled.");

export async function getMilestoneTypes(): Promise<MilestoneType[]> {
  return [];
}

export async function getMilestones(
  _projectId?: string,
): Promise<MilestoneWithProgress[]> {
  return [];
}

export async function createMilestone(
  _input: CreateMilestoneInput,
): Promise<{ id: string; name: string }> {
  throw MILESTONES_DISABLED_ERROR;
}

export async function pinMilestone(
  _id: string,
  _isPinned: boolean,
): Promise<void> {
  throw MILESTONES_DISABLED_ERROR;
}

export async function deleteMilestone(_id: string): Promise<void> {
  throw MILESTONES_DISABLED_ERROR;
}

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
  _projectId: string,
): Promise<ProjectMilestonesResponse> {
  return {
    active: [],
    completed: [],
    pendingCelebrations: [],
  };
}

export async function acknowledgeMilestone(_milestoneId: string): Promise<void> {
  throw MILESTONES_DISABLED_ERROR;
}
