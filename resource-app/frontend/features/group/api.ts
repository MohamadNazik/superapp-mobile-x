import { isAxiosError } from 'axios';
import { httpClient } from '../../api/client';
import { ApiResponse } from '../../api/types';
import { Group, CreateAndUpdateGroupPayload, GroupMember, AddUsersToGroupResult, RemoveUserFromGroupResult } from './types';

const handleApiError = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message;
  }
  return error instanceof Error ? error.message : defaultMessage;
};

export const groupApi = {
  getGroups: async (): Promise<ApiResponse<Group[]>> => {
    try {
      const response = await httpClient.get<{ data: Group[] }>('/groups');
      return { success: true, data: response.data.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to fetch groups') };
    }
  },

  createGroup: async (payload: CreateAndUpdateGroupPayload): Promise<ApiResponse<Group>> => {
    try {
      const response = await httpClient.post<{ data: Group }>('/groups', payload);
      return { success: true, data: response.data.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to create group') };
    }
  },

  updateGroup: async (id: string, payload: CreateAndUpdateGroupPayload): Promise<ApiResponse<Group>> => {
    try {
      const response = await httpClient.patch<{ data: Group }>(`/groups/${id}`, payload);
      return { success: true, data: response.data.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to update group') };
    }
  },

  deleteGroup: async (id: string): Promise<ApiResponse<void>> => {
    try {
      await httpClient.delete(`/groups/${id}`);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to delete group') };
    }
  },

  // ── Membership ───────────────────────────────────────────────

  getGroupMembers: async (groupId: string): Promise<ApiResponse<GroupMember[]>> => {
    try {
      const response = await httpClient.get<{ data: GroupMember[] }>(`/groups/${groupId}/users`);
      return { success: true, data: response.data.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to fetch group members') };
    }
  },

  addUsersToGroup: async (groupId: string, userIds: string[]): Promise<ApiResponse<AddUsersToGroupResult>> => {
    try {
      const response = await httpClient.post<{ data: AddUsersToGroupResult }>(`/groups/${groupId}/users`, { user_ids: userIds });
      return { success: true, data: response.data.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to add users to group') };
    }
  },

  removeUserFromGroup: async (groupId: string, userId: string): Promise<ApiResponse<RemoveUserFromGroupResult>> => {
    try {
      const response = await httpClient.delete<{ data: RemoveUserFromGroupResult }>(`/groups/${groupId}/users/${userId}`);
      return { success: true, data: response.data.data };
    } catch (error: unknown) {
      return { success: false, error: handleApiError(error, 'Failed to remove user from group') };
    }
  },
};
